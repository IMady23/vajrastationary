import { httpsCallable } from 'firebase/functions'
import { functions } from '../../firebase/functions'
import { type VisionProvider, type Prediction, type VisionProviderResult } from './VisionProvider'

const GEMINI_PROMPT = `You are an expert stationery and xerox shop AI recognition assistant.
Analyze ONLY the stationery product held closest to the center of the camera frame.
IGNORE the background, shelves, people, hands, and shop environment.
Return strictly a JSON object with NO markdown formatting, containing a "predictions" array of up to 3 possible matches ordered by confidence (highest first).
Each item MUST have:
- "name": full specific product name (e.g. "Flair Creative Move Mechanical Pencil 0.7mm")
- "brand": brand name or "Unknown" (e.g. "Flair", "Reynolds", "Classmate", "Cello", "Camlin", "Faber-Castell")
- "category": one of ["Pens", "Pencils", "Notebooks", "Books", "Files", "Paper", "Art Supplies", "Craft Materials", "Printing", "Xerox", "Office Supplies", "Others"]
- "confidence": number between 0.00 and 1.00

Never estimate or return price, stock, or shelf location. Return JSON only.`

export class GeminiVisionProvider implements VisionProvider {
  /**
   * Predicts top 3 stationery matches from an image.
   * STRICT ACCURACY RULE: No mock/demo predictions are ever returned.
   */
  async predictTop3(base64Image: string, mimeType = 'image/jpeg'): Promise<VisionProviderResult> {
    const startTime = performance.now()

    if (!base64Image) {
      return {
        predictions: [],
        rawResponseJson: { error: 'EMPTY_IMAGE', message: 'No image data provided' },
        visionTimeMs: 0,
      }
    }

    // 1. Try Firebase Cloud Function: recognizeProduct
    try {
      const callRecognize = httpsCallable(functions, 'recognizeProduct')
      const result: any = await callRecognize({ imageBase64: base64Image, mimeType })
      if (result && result.data && result.data.predictions) {
        const validated = this.validateAndCleanPredictions(result.data.predictions)
        return {
          predictions: validated,
          rawResponseJson: result.data,
          visionTimeMs: Math.round(performance.now() - startTime),
        }
      }
    } catch {
      // Cloud function not deployed or unreachable locally
    }

    // 2. Direct API call using VITE_GEMINI_API_KEY
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey || apiKey === 'placeholder' || apiKey.trim() === '') {
      return {
        predictions: [],
        rawResponseJson: {
          error: 'API_KEY_MISSING',
          message: 'VITE_GEMINI_API_KEY is not set in .env. Please configure your API key or deploy the Firebase Cloud function.',
        },
        visionTimeMs: Math.round(performance.now() - startTime),
      }
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: GEMINI_PROMPT },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            response_mime_type: 'application/json',
          },
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        return {
          predictions: [],
          rawResponseJson: {
            error: 'API_ERROR',
            status: res.status,
            details: json,
          },
          visionTimeMs: Math.round(performance.now() - startTime),
        }
      }

      const textResponse = json?.candidates?.[0]?.content?.parts?.[0]?.text
      if (textResponse) {
        const parsed = JSON.parse(textResponse)
        const validated = this.validateAndCleanPredictions(parsed.predictions)
        return {
          predictions: validated,
          rawResponseJson: parsed,
          visionTimeMs: Math.round(performance.now() - startTime),
        }
      }

      return {
        predictions: [],
        rawResponseJson: { error: 'INVALID_JSON', rawText: textResponse || json },
        visionTimeMs: Math.round(performance.now() - startTime),
      }
    } catch (err: any) {
      return {
        predictions: [],
        rawResponseJson: { error: 'NETWORK_OR_PARSE_ERROR', message: err?.message || String(err) },
        visionTimeMs: Math.round(performance.now() - startTime),
      }
    }
  }

  private validateAndCleanPredictions(rawList: any): Prediction[] {
    if (!Array.isArray(rawList)) return []

    const valid: Prediction[] = []
    for (const item of rawList) {
      if (!item || typeof item !== 'object') continue
      const name = String(item.name || '').trim()
      if (!name) continue

      const rawConf = Number(item.confidence)
      const confidence = isNaN(rawConf) ? 0.75 : Math.max(0, Math.min(1.0, rawConf))

      valid.push({
        name,
        brand: String(item.brand || 'Unknown').trim(),
        category: String(item.category || 'Others').trim(),
        confidence,
      })
    }

    return valid.slice(0, 3)
  }
}
