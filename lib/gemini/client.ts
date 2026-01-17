import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Initialize Gemini API client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Use gemini-1.5-flash - the current stable model
const GEMINI_MODEL = 'gemini-1.5-flash';

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

export function getGeminiModel(): GenerativeModel {
  const client = getGeminiClient();
  // Create fresh model instance each time to avoid stale state
  return client.getGenerativeModel({ model: GEMINI_MODEL });
}

// Check if Gemini is configured
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here';
}

// Get the model name being used
export function getModelName(): string {
  return GEMINI_MODEL;
}
