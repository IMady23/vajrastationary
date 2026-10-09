import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6JHsa91rFyq3mDLZNmzTbJbeQSLBETfJGO0UxV51ZV" });
console.log("Initialized AI:", Object.keys(ai));
ai.models.generateContent({ model: "gemini-2.5-flash", contents: "test" })
  .then(res => console.log(res.text))
  .catch(err => console.error(err.message));
