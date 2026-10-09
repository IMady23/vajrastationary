import * as functions from 'firebase-functions';
import { GoogleGenAI } from '@google/genai';

export const testGemini = functions
  .runWith({ secrets: ['GEMINI_API_KEY'], timeoutSeconds: 30 })
  .https.onCall(async (data: any, context: any) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set.");
      }

      console.log(`[testGemini] Key length: ${apiKey.length}`);
      console.log(`[testGemini] Starts with: ${apiKey.substring(0, 5)}`);

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Reply with OK"
      });

      return {
        success: true,
        text: response.text
      };
    } catch (error: any) {
      console.error("=================================");
      console.error("MINIMAL TEST EXCEPTION");
      console.error("=================================");
      console.error("Message:", error?.message);
      console.error("Stack:", error?.stack);
      console.error("Full Error:", JSON.stringify(error, null, 2));

      return {
        success: false,
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        fullError: error
      };
    }
  });
