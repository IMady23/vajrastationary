"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.recognizeProduct = void 0;
const functions = __importStar(require("firebase-functions"));
const genai_1 = require("@google/genai");
exports.recognizeProduct = functions
    .runWith({ secrets: ['GEMINI_API_KEY'], timeoutSeconds: 60 })
    .https.onCall(async (data, context) => {
    const startTime = Date.now();
    try {
        const { imageBase64 } = data;
        if (!imageBase64) {
            return {
                status: 'INVALID_IMAGE',
                timing: { total: Date.now() - startTime }
            };
        }
        // Pre-validation: basic check on base64 format/size could go here if needed
        // (Client does basic resolution/size validation in Stage 3.1)
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is missing.');
            return {
                status: 'INTERNAL_ERROR',
                timing: { total: Date.now() - startTime }
            };
        }
        const ai = new genai_1.GoogleGenAI({ apiKey });
        // Generate a recognition ID
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const recognitionId = `REC-${timestamp}-${randomSuffix}`;
        const promptText = `
You are an expert AI recognition engine for a stationery and office supplies store.
Analyze the provided image and identify the stationery product.

STRICT INSTRUCTIONS:
1. Ignore the background, tables, human hands, shadows, phone reflections, or any other noise.
2. Focus ONLY on the stationery item closest to the center of the image.
3. If there are multiple distinct products (e.g., a pen and a notebook), flag it as MULTIPLE_PRODUCTS_FOUND.
4. If the image is extremely blurry and you cannot read any text or identify the object, flag it as IMAGE_TOO_BLURRY.
5. If the image is too dark, flag it as LOW_LIGHT.
6. If you cannot find any product, flag it as NO_PRODUCT_FOUND.
7. If the product is heavily cut off, flag it as PARTIAL_PRODUCT.
8. If exactly one product is clearly visible, return SUCCESS.
`;
        // Define strict JSON Schema for Gemini
        const responseSchema = {
            type: genai_1.Type.OBJECT,
            properties: {
                status: {
                    type: genai_1.Type.STRING,
                    description: "Must be one of: SUCCESS, NO_PRODUCT_FOUND, MULTIPLE_PRODUCTS_FOUND, IMAGE_TOO_BLURRY, LOW_LIGHT, PARTIAL_PRODUCT",
                    enum: [
                        "SUCCESS",
                        "NO_PRODUCT_FOUND",
                        "MULTIPLE_PRODUCTS_FOUND",
                        "IMAGE_TOO_BLURRY",
                        "LOW_LIGHT",
                        "PARTIAL_PRODUCT"
                    ]
                },
                prediction: {
                    type: genai_1.Type.OBJECT,
                    description: "Product details. Only populated if status is SUCCESS.",
                    nullable: true,
                    properties: {
                        name: { type: genai_1.Type.STRING, description: "Name of the product" },
                        brand: { type: genai_1.Type.STRING, description: "Brand of the product" },
                        category: { type: genai_1.Type.STRING, description: "Category of the product" },
                        confidence: { type: genai_1.Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
                        confidenceReason: { type: genai_1.Type.STRING, description: "Why you gave this confidence score" },
                        imageQuality: { type: genai_1.Type.STRING, description: "GOOD, AVERAGE, or POOR" }
                    }
                }
            },
            required: ["status"]
        };
        const geminiStartTime = Date.now();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: promptText },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
                            }
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.1 // Low temperature for consistent classification
            }
        });
        const geminiTime = Date.now() - geminiStartTime;
        // Parse response
        const rawText = response.text || '{}';
        let parsedResponse = {};
        try {
            parsedResponse = JSON.parse(rawText);
        }
        catch (e) {
            console.error('Failed to parse Gemini JSON:', rawText);
            return {
                status: 'GEMINI_ERROR',
                timing: {
                    gemini: geminiTime,
                    total: Date.now() - startTime
                }
            };
        }
        const status = parsedResponse.status || 'NO_PRODUCT_FOUND';
        const result = {
            success: status === 'SUCCESS',
            status: status,
            recognitionId: recognitionId,
            engineVersion: '3.1.0',
            model: 'gemini-2.5-flash',
            promptVersion: '1.0',
            prediction: parsedResponse.prediction || null,
            timing: {
                gemini: geminiTime,
                total: Date.now() - startTime
            }
        };
        console.log(`[RecognizeProduct] ID: ${recognitionId} Status: ${status} GeminiMs: ${geminiTime}`);
        return result;
    }
    catch (error) {
        console.error('Error in recognizeProduct Cloud Function:', error);
        return {
            status: 'INTERNAL_ERROR',
            error: error.message || 'Unknown error',
            timing: { total: Date.now() - startTime }
        };
    }
});
//# sourceMappingURL=recognizeProduct.js.map