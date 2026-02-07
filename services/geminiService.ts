
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
    // Block AI calls for 2 minutes to let quota reset
    quotaBlockUntil = Date.now() + 120000;
    return "AI Advisor is temporarily resting (Quota Exceeded). Local systems active.";
  }
  return "Communication error with AI Advisor.";
};

/**
 * Local Fallback Linter
 * Basic regex checks to provide feedback when AI is offline.
 */
const localLint = (code: string, language: string) => {
  if (language === 'javascript') {
    if ((code.match(/{/g) || []).length !== (code.match(/}/g) || []).length) {
      return { error: true, message: "Unmatched curly braces detected.", line: 1 };
    }
    if (code.includes('function') && !code.includes('return') && !code.includes('console.log')) {
      return { error: true, message: "Function may be missing a return statement.", line: 1 };
    }
  }
  return { error: false };
};

// Fix: Use gemini-3-pro-preview for complex coding assistance tasks
export const getCodingHint = async (problem: string, currentCode: string) => {
  if (!checkQuota()) return "AI Advisor is currently offline due to high traffic. Try solving it using the 'Example 1' logic!";
  
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User is working on: "${problem}". 
                 Code: \`${currentCode}\`. 
                 Provide a tiny, cryptic hint to nudge them forward. No solutions.`,
    });
    return response.text || "Hint unavailable.";
  } catch (error) {
    return handleAIError(error);
  }
};

// Fix: Use gemini-3-pro-preview for coding-related formatting
export const formatCode = async (code: string, language: string) => {
  if (!checkQuota()) return code;
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Reformat this ${language} code for better readability. Return ONLY the code, no markdown.\n\n${code}`,
    });
    const text = response.text;
    return text ? text.trim().replace(/^```[a-z]*\n|```$/g, '') : code;
  } catch (err) {
    handleAIError(err);
    return code;
  }
};

// Fix: Use responseSchema for robust JSON handling and upgrade to gemini-3-pro-preview
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
          propertyOrdering: ["error", "message", "line"]
        }
      }
    });
    const text = response.text;
    return text ? JSON.parse(text.trim()) : localLint(code, language);
  } catch (err) {
    handleAIError(err);
    return localLint(code, language);
  }
};

// Fix: Upgrade to gemini-3-pro-preview for step-by-step code execution logic
export const debugCode = async (code: string, language: string) => {
  if (!checkQuota()) return ["Debugging advisor is currently offline."];
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Explain how this ${language} code executes step-by-step.\n\n${code}`,
    });
    const text = response.text;
    return text ? [text] : ["Execution tracing is temporarily unavailable."];
  } catch (err) {
    handleAIError(err);
    return ["Execution tracing is temporarily unavailable."];
  }
};
