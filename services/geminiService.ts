import { GoogleGenAI, Type } from '@google/genai';
import { Gender, Goal, TargetProfile, TopicCategory, Interaction, AssistantMode, User, Target, Tone, AnalysisResponse, IntentResponse } from '../types';
import { saveInteraction } from './userService';

// This implementation moves the Gemini API calls to the client-side.
// This is necessary to resolve the "API Key must be set" error in deployment environments
// that do not support server-side functions in an /api directory and instead bundle all code
// for the browser.
// It assumes that the `process.env.API_KEY` variable is made available to the
// client-side code by the deployment platform's build process.

// --- Client-side Gemini Initialization ---
let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
} catch (error) {
  console.error("Failed to initialize GoogleGenAI. Make sure API_KEY is set in your environment.", error);
  // We'll let individual calls fail to provide a more specific error to the user.
}


// --- Response Schemas for guaranteed JSON output (copied from original /api/gemini.ts) ---
const generateTopicSchema = {
  type: Type.OBJECT,
  properties: {
    openers: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Three distinct conversation opener strings.',
    },
  },
  required: ['openers'],
};

const analyzeAndSuggestReplySchema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.STRING,
      description: 'A detailed strategic analysis of the conversation in Traditional Chinese.',
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Three distinct and optimal reply suggestions, matching the language of the conversation.',
    },
  },
  required: ['analysis', 'suggestions'],
};

const analyzeIntentSchema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description: "The assessed intent in Traditional Chinese, e.g., '目標對象 對 使用者 有好感'.",
    },
    reasoning: {
      type: Type.STRING,
      description: 'Concise, objective reasoning in Traditional Chinese.',
    },
    confidence: {
      type: Type.INTEGER,
      description: 'A confidence score from 0 to 100.',
    },
  },
  required: ['intent', 'reasoning', 'confidence'],
};


// --- Prompt Generation Logic (copied from original /api/gemini.ts) ---
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
    You are 'Echo', a world-class social and relationship strategist. Your primary directive is to maximize the user's probability of success in their stated goal by generating the most effective and precise responses. Your advice is grounded in psychological principles of attraction, communication theory, and analysis of vast datasets of successful human interactions. You are a master strategist: empathetic, insightful, and always focused on the optimal move.

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

// --- Generic Error Handler ---
const handleApiError = (error: any): Error => {
    console.error('Gemini API call error:', error);
    const message = error?.message || String(error);
    if (message.includes('API key not valid')) {
       return new Error('AI 生成失敗，您的 API Key 無效或未設定。');
    }
    return new Error('AI 生成失敗，請檢查您的網路連線或稍後再試。');
}

// --- Rewritten Service Functions ---

export const generateTopic = async (
  interactionData: Omit<Interaction, 'id' | 'timestamp' | 'result' | 'conversation'> & { gender: Gender; profile: TargetProfile, tone: Tone },
  topicCategory: TopicCategory
): Promise<string[]> => {
  if (!ai) throw new Error('Gemini client not initialized. API_KEY might be missing.');
  
  const { gender, goal, profile, tone } = interactionData;
  const basePrompt = getBasePrompt(gender, goal, profile, tone);
  const prompt = `
      ${basePrompt}
      Task: Based on all the context provided, generate three distinct, effective, and context-appropriate conversation openers related to the category '${topicCategory}'. The tone must align with the user's goal, gender strategy, and chosen tone. The openers must be brief and impactful, designed to be easily sent.
  `;
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: prompt, 
        config: { 
            responseMimeType: 'application/json',
            responseSchema: generateTopicSchema,
        }
    });
    const result = JSON.parse(response.text);
    const openers = result.openers || [];
    saveInteraction({ ...interactionData, conversation: `Category: ${topicCategory}`, result: openers });
    return openers;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const analyzeAndSuggestReply = async (
  interactionData: Omit<Interaction, 'id' | 'timestamp' | 'result'> & { gender: Gender; profile: TargetProfile; tone: Tone },
): Promise<AnalysisResponse> => {
  if (!ai) throw new Error('Gemini client not initialized. API_KEY might be missing.');
  
  const { gender, goal, profile, conversation, tone } = interactionData;
  const basePrompt = getBasePrompt(gender, goal, profile, tone);
  const prompt = `
      ${basePrompt}
      Conversation History (User is 'You'):
      ---
      ${conversation}
      ---
      Task:
      1.  **Strategic Analysis:** Deeply analyze the conversation dynamic, subtext, and flow. Your analysis must explain the current situation, the other person's likely receptiveness, and why your suggestions are the strategically optimal moves to get closer to the user's goal. The language of the analysis MUST be in Traditional Chinese.
      2.  **Optimal Suggestions:** Provide three distinct and optimal replies. Each reply must be concise, effective, and tactful, ideally one or two short sentences. Each must be a deliberate step towards achieving the user's goal and match the desired tone. The language of the suggestions MUST match the language used in the conversation history.
  `;

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: prompt, 
        config: {
            responseMimeType: 'application/json',
            responseSchema: analyzeAndSuggestReplySchema,
        }
      });
      const result: AnalysisResponse = JSON.parse(response.text);
      saveInteraction({ ...interactionData, result });
      return result;
  } catch(error) {
      throw handleApiError(error);
  }
};

export const analyzeIntent = async (
  interactionData: Omit<Interaction, 'id' | 'timestamp' | 'result' | 'goal'>,
  user: User,
  target: Target
): Promise<IntentResponse> => {
    if (!ai) throw new Error('Gemini client not initialized. API_KEY might be missing.');

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
        2. Assess their likely intent towards ${userName}. The intent must be specific, naming the individuals. The language of the intent MUST be in Traditional Chinese.
        3. Categorize the intent into one of these: '純友誼', '對你有好感', '尋求親密關係', '沒興趣', or '不明確'.
        4. Provide your reasoning in a concise, objective paragraph, citing evidence. The language of the reasoning MUST be in Traditional Chinese.
        5. Crucially, provide a confidence score (an integer from 0 to 100) representing your certainty in this assessment.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: prompt, 
            config: {
                responseMimeType: 'application/json',
                responseSchema: analyzeIntentSchema,
            }
        });
        const result: IntentResponse = JSON.parse(response.text);
        saveInteraction({ ...interactionData, goal: Goal.Friendship, result });
        return result;
    } catch(error) {
        throw handleApiError(error);
    }
};

export const translateWithCulturalContext = async (
  textToTranslate: string,
  gender: Gender,
  goal: Goal,
  profile: TargetProfile
): Promise<string> => {
    if (!ai) throw new Error('Gemini client not initialized. API_KEY might be missing.');

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
            contents: prompt
        });
        return response.text.trim();
    } catch(error) {
        throw handleApiError(error);
    }
};
