export enum Gender {
  Male = 'male',
  Female = 'female',
}

export enum Goal {
  Friendship = 'friendship',
  Dating = 'dating',
  Casual = 'casual',
  Flirting = 'flirting',
  Business = 'business',
}

export enum Tone {
    Formal = 'formal',
    Flirty = 'flirty',
    Humorous = 'humorous',
    Direct = 'direct',
    Gentle = 'gentle',
}

export enum TopicCategory {
    Hobbies = 'hobbies',
    Travel = 'travel',
    Food = 'food',
    Work = 'work',
    Deep = 'deep',
    Funny = 'funny',
}

export interface TargetProfile {
  nationality: string;
  age: string;
  education: string;
  job: string;
  bodyType: string;
  religion: string;
  diet: string;
  interests: string;
}

export enum AssistantMode {
  GetReply = 'get-reply',
  StartTopic = 'start-topic',
  AnalyzeIntent = 'analyze-intent',
}

export interface AnalysisResponse {
  analysis: string;
  suggestions: string[];
}

export interface IntentResponse {
  intent: string;
  reasoning: string;
  confidence: number;
}

// New types for user management
export interface User {
    id: string;
    email: string;
    passwordHash: string; // In a real app, never store plain text passwords
    gender: Gender;
    isAdmin: boolean;
}

export interface Target {
    id: string;
    userId: string;
    name: string;
    profile: TargetProfile;
}

export interface Interaction {
    id: string;
    userId: string;
    targetId: string;
    goal: Goal;
    mode: AssistantMode;
    conversation: string;
    result: string[] | AnalysisResponse | IntentResponse;
    timestamp: number;
}