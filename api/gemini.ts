// This file should be placed in the /api directory at the root of your project.
// e.g. /api/gemini.ts

import { GoogleGenAI } from '@google/genai';
import { Gender, Goal, TargetProfile, Tone, User, Target } from '../types';

// This config specifies the Vercel runtime. Edge is fast and recommended.
export const config = {
  runtime: 'edge',
};

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
      throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

const getBasePrompt = (gender: Gender, goal: Goal, profile: TargetProfile, tone: Tone | null): string => {
  const goalMap: Record<Goal, string> = {
    [Goal.Friendship]: 'purely platonic friendship',
    [Goal.Dating]: 'a serious, long-term relationship',
    [Goal.Flirting]: 'light-hearted flirting and building romantic tension',
    [Goal.Casual]: 'a casual, low-commitment intimate relationship',
    [Goal.Business]: 'building trust for a business partnership',
  };
  
  const toneMap: Record<Tone, string> = {
      [Tone.Formal]: 'formal and professional',
      [Tone.Flirty]: 'flirty and charming',
      [Tone.Humorous]: 'humorous and light-hearted',
      [Tone.Direct]: 'direct and straightforward',
      [Tone.Gentle]: 'gentle and considerate',
  };

  const genderContext = gender === Gender.Male ? "User is male." : "User is female.";
  const profileString = Object.entries(profile).filter(([, val]) => val).map(([key, val]) => `${key}: ${val}`).join(', ') || 'Not specified';

  return `
    You are an AI social assistant.
    User's Gender: ${gender} (${genderContext})
    User's Goal: ${goalMap[goal]}
    ${tone ? `- Desired Tone: ${toneMap[tone]}` : ''}
    Target's Profile: ${profileString}
    ---
  `;
};

// Helper to stream the AI response
const streamAIResponse = async (prompt: string, ai: GoogleGenAI) => {
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
        async start(controller) {
            try {
                const stream = await ai.models.generateContentStream({
                    model: 'gemini-flash-latest',
                    contents: prompt,
                });

                for await (const chunk of stream) {
                    if (chunk.text) {
                        controller.enqueue(encoder.encode(chunk.text));
                    }
                }
                controller.close();
            } catch (error: any) {
                console.error('Error during AI stream generation:', error);
                controller.error(new Error('Failed to generate AI response.'));
            }
        },
    });

    return new Response(readableStream, {
        headers: { 
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
        },
    });
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
            status: 405, headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { action, payload } = await request.json();
        const ai = getClient();
        
        let prompt: string;

        switch (action) {
            case 'generateTopic': {
                const { gender, goal, profile, tone, topicCategory } = payload;
                const basePrompt = getBasePrompt(gender, goal, profile, tone);
                prompt = `
                    ${basePrompt}
                    Task: Generate three distinct, concise, and effective conversation openers for the category '${topicCategory}'. Personalize them to the target's profile.
                    
                    Format the output as a valid JSON object with a single key "openers", which is an array of three strings.
                    Example: {"openers": ["opener1", "opener2", "opener3"]}
                `;
                return await streamAIResponse(prompt, ai);
            }

            case 'analyzeAndSuggestReply': {
                const { gender, goal, profile, conversation, tone } = payload;
                const basePrompt = getBasePrompt(gender, goal, profile, tone);
                prompt = `
                    ${basePrompt}
                    Conversation History (User is 'You'):
                    ---
                    ${conversation}
                    ---
                    Task: Analyze the conversation and provide a strategic analysis and three optimal reply suggestions.
                    
                    Format the output as a valid JSON object with two keys:
                    1. "analysis": A string containing a brief strategic analysis of the conversation (in Traditional Chinese).
                    2. "suggestions": An array of three distinct reply suggestion strings (matching the conversation's language).
                `;
                return await streamAIResponse(prompt, ai);
            }

            case 'analyzeIntent': {
                const { conversation, user, target } = payload as { conversation: string, user: User, target: Target };
                prompt = `
                    You are an objective conversation analyst AI. Analyze the conversation between User (${user.gender}) and Target (${target.name}) and determine the Target's intent.

                    Conversation History:
                    ---
                    ${conversation}
                    ---
                    Task: Analyze the conversation and determine the target's intent.

                    Format your output as a valid JSON object with three keys:
                    1. "intent": A string from this list: '純友誼', '對你有好感', '尋求親密關係', '沒興趣', '不明確'.
                    2. "reasoning": A string with a brief explanation for your choice (in Traditional Chinese).
                    3. "confidence": An integer between 0 and 100 representing your confidence level.
                `;
                return await streamAIResponse(prompt, ai);
            }

            case 'translateWithCulturalContext': {
                 const { textToTranslate, gender, goal, profile } = payload;
                 const basePrompt = getBasePrompt(gender, goal, profile, null);
                 prompt = `
                    ${basePrompt}
                    Task: Transcreate the following text. This is not a literal translation. Adapt the original intent, tone, and nuance to sound natural in the target language (English or Traditional Chinese), fitting the user's goal.
                    
                    CRITICAL: Format your output as a valid JSON object with a single key "translation" containing the transcreated string.
                    Example: {"translation": "Your translated text here."}

                    Text to Transcreate:
                    ---
                    ${textToTranslate}
                    ---
                `;
                return await streamAIResponse(prompt, ai);
            }

            default:
                return new Response(JSON.stringify({ message: 'Invalid action' }), {
                    status: 400, headers: { 'Content-Type': 'application/json' }
                });
        }
    } catch (error: any) {
        console.error('API Route Error:', error);
        const errorMessage = error.message || 'An internal server error occurred.';
        return new Response(JSON.stringify({ message: errorMessage }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}
