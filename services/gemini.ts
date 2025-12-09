import { GoogleGenAI, Modality } from "@google/genai";
import { decodeAudioData } from "./audio";

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;

try {
  const key = process.env.API_KEY;
  if (key && key.length > 0) {
    ai = new GoogleGenAI({ apiKey: key });
  }
} catch (e) {
  console.warn("Gemini Client failed to initialize immediately.");
}

// Helper to ensure AI is ready and throw clear error if not
const getAI = () => {
  if (!ai) {
    // Double check if key exists now (in case of race conditions, though unlikely with define)
    const key = process.env.API_KEY;
    if (key && key.length > 0) {
      ai = new GoogleGenAI({ apiKey: key });
      return ai;
    }
    throw new Error("API Key is missing. Please check Vercel Environment Variables (VITE_GEMINI_API_KEY).");
  }
  return ai;
};

export const generateSummary = async (text: string): Promise<string> => {
  if (!text) return "";
  try {
    const client = getAI();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following note in one concise sentence: ${text}`,
    });
    return response.text || "";
  } catch (error: any) {
    console.error("AI Summary Error:", error);
    throw new Error(error.message || "Failed to generate summary");
  }
};

export const enhanceNote = async (text: string, instruction: string): Promise<string> => {
  try {
    const client = getAI();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert editor. Current note: "${text}". Instruction: ${instruction}. Return only the improved text.`,
    });
    return response.text || text;
  } catch (error: any) {
    console.error("AI Enhance Error:", error);
    throw new Error(error.message || "Failed to enhance note");
  }
};

export const textToSpeech = async (text: string): Promise<AudioBuffer | null> => {
  try {
    const client = getAI();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received from API");
    }

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000
    });

    return await decodeAudioData(base64Audio, outputAudioContext);

  } catch (error: any) {
    console.error("TTS Error:", error);
    throw new Error(error.message || "Text-to-Speech failed");
  }
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  try {
    const client = getAI();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          {
            text: "Transcribe the audio exactly. Please include proper punctuation and capitalization."
          }
        ]
      }
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Transcription Error:", error);
    throw new Error(error.message || "Transcription failed");
  }
};