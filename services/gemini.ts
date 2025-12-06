import { GoogleGenAI, Modality } from "@google/genai";
import { decodeAudioData } from "./audio";

// Initialize Gemini Client
// We use a getter or simple check to avoid crashing the whole app if API_KEY is missing during initialization
let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
} catch (e) {
  console.warn("Gemini Client failed to initialize. Check API Key.");
}

export const generateSummary = async (text: string): Promise<string> => {
  if (!text) return "";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following note in one concise sentence: ${text}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("AI Summary Error:", error);
    throw error;
  }
};

export const enhanceNote = async (text: string, instruction: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert editor. Current note: "${text}". Instruction: ${instruction}. Return only the improved text.`,
    });
    return response.text || text;
  } catch (error) {
    console.error("AI Enhance Error:", error);
    throw error;
  }
};

export const textToSpeech = async (text: string): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
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
      throw new Error("No audio data received");
    }

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000
    });

    return await decodeAudioData(base64Audio, outputAudioContext);

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
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
  } catch (error) {
    console.error("Transcription Error:", error);
    throw error;
  }
};