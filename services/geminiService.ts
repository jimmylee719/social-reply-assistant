import { Gender, Goal, TargetProfile, TopicCategory, Interaction, AssistantMode, User, Target, Tone, AnalysisResponse, IntentResponse } from '../types';
import { saveInteraction } from './userService';

// This service acts as a client to our own backend API route (/api/gemini),
// which securely handles the Gemini API calls on the server-side.

// Generic API call helper
const callApi = async (action: string, payload: any) => {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
        });

        const result = await response.json();

        if (!response.ok) {
            // Use the error message from the backend, or a default
            throw new Error(result.message || `API request failed with status ${response.status}`);
        }

        return result;

    } catch (error: any) {
        console.error(`API client error for action '${action}':`, error);
        // Re-throw a user-friendly error
        throw new Error(error.message || 'AI generation failed. Please check your connection or try again later.');
    }
};

export const generateTopic = async (
  interactionData: Omit<Interaction, 'id' | 'timestamp' | 'result' | 'conversation'> & { gender: Gender; profile: TargetProfile, tone: Tone },
  topicCategory: TopicCategory
): Promise<string[]> => {
  const payload = { ...interactionData, topicCategory };
  const result = await callApi('generateTopic', payload);
  const openers = result.openers || [];
  saveInteraction({ ...interactionData, conversation: `Category: ${topicCategory}`, result: openers });
  return openers;
};

export const analyzeAndSuggestReply = async (
  interactionData: Omit<Interaction, 'id' | 'timestamp' | 'result'> & { gender: Gender; profile: TargetProfile; tone: Tone },
): Promise<AnalysisResponse> => {
  const result: AnalysisResponse = await callApi('analyzeAndSuggestReply', interactionData);
  saveInteraction({ ...interactionData, result });
  return result;
};

export const analyzeIntent = async (
  interactionData: Omit<Interaction, 'id' | 'timestamp' | 'result' | 'goal'>,
  user: User,
  target: Target
): Promise<IntentResponse> => {
    const payload = { ...interactionData, user, target };
    const result: IntentResponse = await callApi('analyzeIntent', payload);
    saveInteraction({ ...interactionData, goal: Goal.Friendship, result });
    return result;
};

export const translateWithCulturalContext = async (
  textToTranslate: string,
  gender: Gender,
  goal: Goal,
  profile: TargetProfile
): Promise<string> => {
    const payload = { textToTranslate, gender, goal, profile };
    const result = await callApi('translateWithCulturalContext', payload);
    return result.translation || '';
};
