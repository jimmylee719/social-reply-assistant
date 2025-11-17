// This file should be placed in the /api directory at the root of your project.
// e.g. /api/gemini.ts

import { GoogleGenAI } from '@google/genai';
import { Gender, Goal, TargetProfile, Tone, User, Target } from '../types';

// This config specifies the Vercel runtime. Edge is fast and recommended.
export const config = {
  runtime: 'edge',
};

const getClient = () => {
  // IMPORTANT: This check ensures the Vercel environment variable is configured.
  if (!process.env.API_KEY) {
    throw new Error("Server-side Error: The API_KEY environment variable is not set in your Vercel project.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// A robust function to parse JSON, even if it's wrapped in markdown backticks
const parseJsonResponse = (text: string): any => {
    // Find the start and end of the JSON block
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("AI did not return a valid JSON object.");
    }
    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonString);
}


const getSystemInstruction = (gender: Gender, goal: Goal, profile: TargetProfile, tone: Tone | null): string => {
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

  const profileString = Object.entries(profile).filter(([, val]) => val).map(([key, val]) => `${key}: ${val}`).join(', ') || 'Not specified';

  return `You are an expert AI social assistant. Your user is ${gender}. Their goal is to achieve ${goalMap[goal]}. The target person's profile is: ${profileString}. ${tone ? `Your tone should be ${toneMap[tone]}.` : ''} You MUST respond in valid JSON format as requested.`;
};

// Helper to make the AI call and return a clean JSON response
const generateJsonResponse = async (prompt: string, systemInstruction: string, ai: GoogleGenAI) => {
    const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
            systemInstruction,
        }
    });

    const aiText = response.text;
    if (!aiText) {
        throw new Error("AI returned an empty response.");
    }
    const jsonData = parseJsonResponse(aiText);
    return new Response(JSON.stringify(jsonData), {
        headers: { 'Content-Type': 'application/json' },
    });
};


export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
            status: 405, headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const ai = getClient(); // This will throw early if API_KEY is missing
        const { action, payload } = await request.json();
        
        let prompt: string;
        let systemInstruction: string;

        switch (action) {
            case 'generateTopic': {
                const { gender, goal, profile, tone, topicCategory } = payload;
                systemInstruction = getSystemInstruction(gender, goal, profile, tone);
                prompt = `Generate three distinct, concise, and effective conversation openers for the category '${topicCategory}'. Personalize them to the target's profile. Format the output as a valid JSON object with a single key "openers", which is an array of three strings.`;
                return await generateJsonResponse(prompt, systemInstruction, ai);
            }

            case 'analyzeAndSuggestReply': {
                const { gender, goal, profile, conversation, tone } = payload;
                systemInstruction = getSystemInstruction(gender, goal, profile, tone);
                prompt = `Analyze the following conversation (User is 'You') and provide a strategic analysis and three optimal reply suggestions.\n\nConversation:\n${conversation}\n\nFormat the output as a valid JSON object with two keys: 1. "analysis": A string containing a brief strategic analysis (in Traditional Chinese). 2. "suggestions": An array of three distinct reply suggestion strings.`;
                return await generateJsonResponse(prompt, systemInstruction, ai);
            }

            case 'analyzeIntent': {
                const { conversation, user, target } = payload as { conversation: string, user: User, target: Target };
                systemInstruction = `You are an objective conversation analyst AI. Analyze the conversation between User (${user.gender}) and Target (${target.name}) and determine the Target's intent. You MUST respond in valid JSON format.`;
                prompt = `Conversation History:\n${conversation}\n\nTask: Analyze the conversation and determine the target's intent. Format your output as a valid JSON object with three keys: 1. "intent": A string from this list: '純友誼', '對你有好感', '尋求親密關係', '沒興趣', '不明確'. 2. "reasoning": A string with a brief explanation for your choice (in Traditional Chinese). 3. "confidence": An integer between 0 and 100.`;
                return await generateJsonResponse(prompt, systemInstruction, ai);
            }

            case 'translateWithCulturalContext': {
                 const { textToTranslate, gender, goal, profile } = payload;
                 systemInstruction = getSystemInstruction(gender, goal, profile, null);
                 prompt = `Transcreate the following text. This is not a literal translation. Adapt the original intent, tone, and nuance to sound natural in the target language (English or Traditional Chinese), fitting the user's goal.\n\nText to Transcreate:\n${textToTranslate}\n\nCRITICAL: Format your output as a valid JSON object with a single key "translation" containing the transcreated string.`;
                 return await generateJsonResponse(prompt, systemInstruction, ai);
            }

            default:
                return new Response(JSON.stringify({ message: 'Invalid action' }), {
                    status: 400, headers: { 'Content-Type': 'application/json' }
                });
        }
    } catch (error: any) {
        console.error('API Route Error:', error);
        // Ensure even errors are sent back as JSON
        const errorMessage = error.message || 'An internal server error occurred.';
        return new Response(JSON.stringify({ message: errorMessage }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}
