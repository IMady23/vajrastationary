import * as functions from 'firebase-functions'
import OpenAI from 'openai'

export const recognizeProduct = functions
  .runWith({ secrets: ['OPENROUTER_API_KEY'], timeoutSeconds: 60 })
  .https.onCall(async (data: any, context: any) => {
    const startTime = Date.now()

    try {
      const { imageBase64 } = data

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return {
          status: 'INVALID_IMAGE',
          timing: { total: Date.now() - startTime }
        }
      }

      // 1. Validate and parse Data URL
      const dataUrlRegex = /^data:(image\/[a-zA-Z0-9.+]+);base64,(.+)$/;
      const match = imageBase64.match(dataUrlRegex);

      if (!match) {
        console.error("Invalid image format or missing Data URL prefix.");
        return {
          status: 'INVALID_IMAGE',
          timing: { total: Date.now() - startTime }
        }
      }

      const mimeType = match[1];
      let pureBase64 = match[2];

      // 2. Safely clean Base64 payload (remove any unexpected whitespaces)
      pureBase64 = pureBase64.replace(/\s+/g, '');

      if (!pureBase64 || pureBase64.length === 0) {
        console.error("Base64 payload is empty after cleaning.");
        return {
          status: 'INVALID_IMAGE',
          timing: { total: Date.now() - startTime }
        }
      }

      // 3. Log debug info safely
      console.log(`[RecognizeProduct] Detected MIME: ${mimeType}`);
      console.log(`[RecognizeProduct] Base64 Length: ${pureBase64.length} chars`);
      console.log(`[RecognizeProduct] Base64 Starts with: ${pureBase64.substring(0, 20)}...`);

      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) {
        console.error('OPENROUTER_API_KEY is missing.')
        return {
          status: 'INTERNAL_ERROR',
          timing: { total: Date.now() - startTime }
        }
      }

      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey
      })

      // Generate a recognition ID
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
      const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
      const recognitionId = `REC-${timestamp}-${randomSuffix}`

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

You MUST return a JSON object strictly matching this format:
{
  "status": "SUCCESS" | "NO_PRODUCT_FOUND" | "MULTIPLE_PRODUCTS_FOUND" | "IMAGE_TOO_BLURRY" | "LOW_LIGHT" | "PARTIAL_PRODUCT",
  "prediction": { // Only populated if status is SUCCESS
    "name": "Name of the product",
    "brand": "Brand of the product",
    "category": "Category of the product",
    "confidence": 0.95, // Confidence score between 0.0 and 1.0
    "confidenceReason": "Why you gave this confidence score",
    "imageQuality": "GOOD" | "AVERAGE" | "POOR"
  }
}
`

      const aiStartTime = Date.now()
      
      const response = await openai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${pureBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })

      const aiTime = Date.now() - aiStartTime
      
      // Parse response
      const rawText = response.choices[0]?.message?.content || '{}'
      let parsedResponse: any = {}
      
      try {
        parsedResponse = JSON.parse(rawText)
      } catch (e) {
        console.error('Failed to parse OpenRouter JSON:', rawText)
        return {
          status: 'AI_ERROR',
          timing: { 
            ai: aiTime,
            total: Date.now() - startTime 
          }
        }
      }

      const status = parsedResponse.status || 'NO_PRODUCT_FOUND'
      
      const result = {
        success: status === 'SUCCESS',
        status: status,
        recognitionId: recognitionId,
        engineVersion: '3.1.0',
        model: 'gemini-2.0-flash',
        promptVersion: '1.0',
        prediction: parsedResponse.prediction || null,
        timing: {
          ai: aiTime,
          total: Date.now() - startTime
        }
      }

      console.log(`[RecognizeProduct] ID: ${recognitionId} Status: ${status} AIMs: ${aiTime}`)

      return result

    } catch (error: any) {
      console.error("=================================");
      console.error("FULL CLOUD FUNCTION ERROR");
      console.error("=================================");
      console.error("Message:", error?.message);
      console.error("Code:", error?.code);
      console.error("Stack:", error?.stack);
      console.error("Full Error:", JSON.stringify(error, null, 2));

      throw new functions.https.HttpsError(
        "internal",
        error?.message || "Unknown error"
      );
    }
  })
