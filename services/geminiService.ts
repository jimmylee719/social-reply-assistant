import { GoogleGenAI, Type } from '@google/genai';
// FIX: Import 'AnalysisResponse' and 'IntentResponse' types.
import { Gender, Goal, TargetProfile, TopicCategory, Interaction, AssistantMode, User, Target, Tone, AnalysisResponse, IntentResponse } from '../types';
import { saveInteraction } from './userService';

const getClient = () => {
  // FIX: Per coding guidelines, the API key must be obtained from process.env.API_KEY.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getBasePrompt = (gender: Gender, goal: Goal, profile: TargetProfile, tone: Tone | null): string => {
  const goalMap: Record<Goal, string> = {
    [Goal.Friendship]: '純粹交朋友',
    [Goal.Dating]: '尋找認真的戀愛關係',
    [Goal.Flirting]: '進行輕鬆的調情，營造曖昧氛圍',
    [Goal.Casual]: '尋求直接的、輕鬆的親密關係',
    [Goal.Business]: '建立商業信任與合作關係',
  };
  
  const toneMap: Record<Tone, string> = {
      [Tone.Formal]: '正式、專業、有禮貌',
      [Tone.Flirty]: '曖昧、充滿暗示、有吸引力',
      [Tone.Humorous]: '幽默、輕鬆、有趣',
      [Tone.Direct]: '直接、坦率、不拐彎抹角',
      [Tone.Gentle]: '溫和、有同理心、體貼',
  };

  const genderContext = gender === Gender.Male
    ? "As a man, the user should generally be proactive, confident, and clear, while also being attentive and respectful."
    : "As a woman, the user should generally focus on building rapport, expressing interest through subtle cues, and maintaining safety and comfort.";

  return `
    You are 'Echo', a world-class social and relationship strategist. Your primary directive is to maximize the user's probability of success in achieving their stated goal by generating the most effective and precise responses. Your advice is grounded in psychological principles of attraction, communication theory, and analysis of vast datasets of successful human interactions. You are a master strategist: empathetic, insightful, and always focused on the optimal move.

    CRITICAL: You MUST heavily weigh the provided target person's profile details and any clues from the conversation to generate hyper-personalized and deeply resonant responses. Generic answers are unacceptable.

    User Context:
    - User's Gender: ${gender} (${genderContext})
    - User's Goal: ${goalMap[goal]}
    ${tone ? `- Desired Tone: ${toneMap[tone]}` : ''}
    - Target Person's Profile:
      - Nationality: ${profile.nationality || 'Not specified'}
      - Age: ${profile.age || 'Not specified'}
      - Education: ${profile.education || 'Not specified'}
      - Job: ${profile.job || 'Not specified'}
      - Body Type: ${profile.bodyType || 'Not specified'}
      - Religion: ${profile.religion || 'Not specified'}
      - Diet: ${profile.diet || 'Not specified'}
      - Interests: ${profile.interests || 'Not specified'}
  `;
};

const getLanguageInstruction = (conversation: string, forceAnalysisLanguage: string | null = null): string => {
  let instruction = `CRITICAL INSTRUCTION: Analyze the language used in the provided conversation history. Your final suggested replies MUST be in the same language. If no conversation is provided, use the language of the user's prompt.`;
  if (forceAnalysisLanguage) {
      instruction += ` The 'analysis', 'intent', and 'reasoning' fields in your JSON response MUST be in ${forceAnalysisLanguage}. The 'suggestions' or 'openers' fields should still match the conversation language if provided, otherwise default to Traditional Chinese.`;
  }
  instruction += ` Do not add any extra commentary outside of the requested JSON format.`;
  return instruction;
};

const executeApiCall = async (
    interactionData: Omit<Interaction, 'id' | 'timestamp' | 'result'>,
    prompt: string,
    schema: any
) => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const result = JSON.parse(response.text);
        saveInteraction({ ...interactionData, result });
        return result;

    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('AI 生成失敗，請檢查您的 API Key 或稍後再試。');
    }
};

export const generateTopic = async (
  interactionData: Omit<Interaction, 'id' | 'timestamp' | 'result' | 'conversation'> & { gender: Gender; profile: TargetProfile, tone: Tone },
  topicCategory: TopicCategory
): Promise<string[]> => {
  const { gender, goal, profile, tone } = interactionData;
  const basePrompt = getBasePrompt(gender, goal, profile, tone);
  const prompt = `
    ${basePrompt}
    Task: Based on all the context provided, generate three distinct, effective, and context-appropriate conversation openers related to the category '${topicCategory}'. The tone must align with the user's goal, gender strategy, and chosen tone. The openers must be brief and impactful, designed to be easily sent.
    ${getLanguageInstruction('', 'Traditional Chinese')}
  `;
  const schema = {
      type: Type.OBJECT,
      properties: {
        openers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of exactly 3 conversation starter strings." }
      },
      required: ['openers']
  };
  
  const result = await executeApiCall({ ...interactionData, conversation: `Category: ${topicCategory}` }, prompt, schema);
  return result.openers || [];
};

export const analyzeAndSuggestReply = async (
  interactionData: Omit<Interaction, 'id' | 'timestamp' | 'result'> & { gender: Gender; profile: TargetProfile; tone: Tone },
): Promise<AnalysisResponse> => {
  const { gender, goal, profile, conversation, tone } = interactionData;
  const basePrompt = getBasePrompt(gender, goal, profile, tone);
  const prompt = `
    ${basePrompt}
    Conversation History (User is 'You'):
    ---
    ${conversation}
    ---
    Task:
    1.  **Strategic Analysis:** Deeply analyze the conversation dynamic, subtext, and flow. Your 'analysis' must explain the current situation, the other person's likely receptiveness, and why your suggestions are the strategically optimal moves to get closer to the user's goal. Ensure your analysis is correct and insightful.
    2.  **Optimal Suggestions:** Provide a 'suggestions' array containing three distinct and optimal replies. Each reply must be concise, effective, and tactful, ideally one or two short sentences. Each must be a deliberate step towards achieving the user's goal and match the desired tone.
    ${getLanguageInstruction(conversation, 'Traditional Chinese')}
  `;
  const schema = {
      type: Type.OBJECT,
      properties: {
        analysis: { type: Type.STRING },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of exactly 3 reply suggestion strings." }
      },
      required: ['analysis', 'suggestions']
  };

  return await executeApiCall(interactionData, prompt, schema);
};

export const analyzeIntent = async (
  interactionData: Omit<Interaction, 'id' | 'timestamp' | 'result' | 'goal'>,
  user: User,
  target: Target
): Promise<IntentResponse> => {
  const { conversation } = interactionData;
  const userName = user.email.split('@')[0];
  const targetName = target.name;
  const userGenderName = user.gender === Gender.Male ? "男方" : "女方";
  const targetGenderName = user.gender === Gender.Male ? "女方" : "男方";

  const prompt = `
    You are 'Echo', a world-class social and relationship analyst. Your task is to objectively analyze a conversation and determine the other person's intent towards the user, providing a quantitative confidence score. Avoid emotional language and provide a data-driven assessment.

    Context:
    - The user is: ${userName} (${userGenderName})
    - The other person is: ${targetName} (${targetGenderName})

    Conversation History:
    ---
    ${conversation}
    ---
    Task:
    1. Analyze the conversation, focusing on ${targetName}'s language, tone, questions, and response patterns.
    2. Assess their likely 'intent' towards ${userName}. The 'intent' field MUST be specific, naming the individuals. Example: '${targetName} 對 ${userName} 有好感'.
    3. Categorize the intent into one of these: '純友誼', '對你有好感', '尋求親密關係', '沒興趣', or '不明確'. Adapt this to the A-to-B format.
    4. Provide your 'reasoning' in a concise, objective paragraph, citing evidence.
    5. Crucially, provide a 'confidence' score (an integer from 0 to 100) representing your certainty in this assessment based on the available data. A low score indicates ambiguity. A high score indicates strong evidence.
    ${getLanguageInstruction(conversation, 'Traditional Chinese')}
  `;
  const schema = {
      type: Type.OBJECT,
      properties: {
        intent: { type: Type.STRING },
        reasoning: { type: Type.STRING },
        confidence: { type: Type.INTEGER }
      },
      required: ['intent', 'reasoning', 'confidence']
  };

  return await executeApiCall({ ...interactionData, goal: Goal.Friendship }, prompt, schema);
};

export const translateWithCulturalContext = async (
  textToTranslate: string,
  gender: Gender,
  goal: Goal,
  profile: TargetProfile
): Promise<string> => {
    const ai = getClient();
    const basePrompt = getBasePrompt(gender, goal, profile, null);

    const prompt = `
        ${basePrompt}
        Task: Perform a culturally-aware translation (transcreation) of the following text. Your goal is NOT a literal word-for-word translation. Instead, you must capture the original text's core intent, tone (e.g., playful, serious, flirty), and social nuance, then express it naturally and effectively in the target language.

        - If the text is in Chinese, translate it to natural-sounding English.
        - If the text is in English, translate it to natural-sounding Traditional Chinese (繁體中文).
        - The translation must be appropriate for the user's goal and the target's profile.
        - Return ONLY the translated string, with no extra explanations or labels.

        Text to Transcreate:
        ---
        ${textToTranslate}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error('Gemini API translation error:', error);
        throw new Error('AI 翻譯失敗，請稍後再試。');
    }
};
