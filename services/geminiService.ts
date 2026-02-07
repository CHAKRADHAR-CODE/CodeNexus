
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

let quotaBlockUntil = 0;

const checkQuota = () => {
  if (Date.now() < quotaBlockUntil) return false;
  return true;
};

const handleAIError = (error: any) => {
  const msg = error?.message || "";
  if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
    quotaBlockUntil = Date.now() + 120000;
    return "AI Advisor is temporarily resting (Quota Exceeded). Local systems active.";
  }
  return "Communication error with AI Advisor.";
};

const localLint = (code: string, language: string) => {
  if (language === 'javascript') {
    if ((code.match(/{/g) || []).length !== (code.match(/}/g) || []).length) {
      return { error: true, message: "Unmatched curly braces detected.", line: 1 };
    }
  }
  return { error: false };
};

export const getCodingHint = async (problem: string, currentCode: string) => {
  if (!checkQuota()) return "AI Advisor is currently offline. Keep pushing!";
  
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User is working on: "${problem}". Code: \`${currentCode}\`. Provide a tiny, cryptic hint to nudge them forward. No solutions.`,
    });
    return response.text || "Hint unavailable.";
  } catch (error) {
    return handleAIError(error);
  }
};

export const getAICoachAdvice = async (points: number, streak: number, completedTopics: string[]) => {
  if (!checkQuota()) return "Focus on consistency to unlock deeper AI insights!";
  
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `A student has ${points} XP, a ${streak}-day streak, and finished these topic IDs: ${completedTopics.join(', ')}. 
                 Give 2 bullet points of ultra-short, motivating career or technical advice based on their current progress. 
                 Keep it professional and high-tech. Max 20 words.`,
    });
    return response.text || "Keep building great things.";
  } catch (error) {
    return handleAIError(error);
  }
};

export const formatCode = async (code: string, language: string) => {
  if (!checkQuota()) return code;
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Reformat this ${language} code for better readability. Return ONLY the code, no markdown.\n\n${code}`,
    });
    return response.text ? response.text.trim().replace(/^```[a-z]*\n|```$/g, '') : code;
  } catch (err) {
    handleAIError(err);
    return code;
  }
};

export const lintCode = async (code: string, language: string) => {
  if (!checkQuota()) return localLint(code, language);
  
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Linter for ${language}. Flag critical syntax errors only in the following code:\n\n${code}`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            error: { type: Type.BOOLEAN, description: 'True if syntax errors are found.' },
            message: { type: Type.STRING, description: 'The error message.' },
            line: { type: Type.NUMBER, description: 'The 1-based line number of the error.' }
          },
          required: ['error', 'message', 'line'],
        }
      }
    });
    return response.text ? JSON.parse(response.text.trim()) : localLint(code, language);
  } catch (err) {
    handleAIError(err);
    return localLint(code, language);
  }
};
