
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// State management for quota
let quotaBlockUntil = 0;

const checkQuota = () => {
  if (Date.now() < quotaBlockUntil) return false;
  return true;
};

const handleAIError = (error: any) => {
  const msg = error?.message || "";
  if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
    quotaBlockUntil = Date.now() + 120000;
    return "AI Advisor is temporarily resting (Quota Exceeded).";
  }
  return "Communication error with AI Advisor.";
};

export const getTopicInsight = async (topicTitle: string, moduleTitle: string, description: string) => {
  if (!checkQuota()) return "AI insights are currently unavailable due to high demand.";
  
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a high-level technical summary and 'why it matters' for the following engineering unit.
                 Track: ${topicTitle}
                 Unit: ${moduleTitle}
                 Context: ${description}
                 
                 Keep it professional, concise, and inspiring for a software engineer.`,
    });
    return response.text || "Insight unavailable at this time.";
  } catch (error) {
    return handleAIError(error);
  }
};

export const getCodingHint = async (problem: string, currentCode: string) => {
  if (!checkQuota()) return "AI Advisor is currently offline. Try checking the documentation!";
  
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User is working on: "${problem}". Code: \`${currentCode}\`. Provide a tiny, cryptic hint. No solutions.`,
    });
    return response.text || "Hint unavailable.";
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
    return response.text?.trim().replace(/^```[a-z]*\n|```$/g, '') || code;
  } catch (err) {
    return code;
  }
};
