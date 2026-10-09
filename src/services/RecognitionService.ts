import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../firebase/firebase'

export interface RecognitionResult {
  success: boolean
  status: string
  recognitionId?: string
  engineVersion?: string
  model?: string
  promptVersion?: string
  prediction?: {
    name: string
    brand: string
    category: string
    confidence: number
    confidenceReason: string
    imageQuality: string
  }
  timing: {
    gemini?: number
    total: number
  }
}

export interface AIAnalyticsStats {
  total: number
  success: number
  failed: number
  avgConfidence: number
}

export class RecognitionService {
  /**
   * Reads a File or Blob, validates it, and converts it to a base64 string.
   */
  private static async prepareImage(file: File | Blob): Promise<string> {
    // Basic validation
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('FILE_TOO_LARGE')
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('UNSUPPORTED_FORMAT')
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = () => reject(new Error('READ_ERROR'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Validates image dimensions to ensure minimum resolution is met.
   */
  private static async validateDimensions(base64: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        if (img.width < 320 || img.height < 320) {
          reject(new Error('RESOLUTION_TOO_LOW'))
        }
        resolve()
      }
      img.onerror = () => reject(new Error('INVALID_IMAGE'))
      img.src = base64
    })
  }

  /**
   * Invokes the Cloud Function directly with the image bytes, avoiding temporary storage uploads.
   */
  static async recognizeImage(file: File | Blob): Promise<RecognitionResult> {
    const startTime = Date.now()

    try {
      // 1. Prepare and validate image
      const imageBase64 = await this.prepareImage(file)
      
      console.log(`[RecognitionService] Data URL starts with: ${imageBase64.substring(0, 40)}...`);
      console.log(`[RecognitionService] Total Payload Length: ${imageBase64.length} chars`);
      
      await this.validateDimensions(imageBase64)

      // 2. Call Cloud Function
      const functions = getFunctions(app)
      const recognizeProductCall = httpsCallable<{ imageBase64: string }, RecognitionResult>(functions, 'recognizeProduct')
      
      const response = await recognizeProductCall({ imageBase64 })
      const data = response.data

      // 3. Supplement timing with total client-side network timing
      if (data && data.timing) {
        data.timing.total = Date.now() - startTime
      }

      return data

    } catch (error: any) {
      console.error('RecognitionService error:', error)
      
      let status = 'INTERNAL_ERROR'
      if (error.message === 'FILE_TOO_LARGE' || error.message === 'UNSUPPORTED_FORMAT' || error.message === 'RESOLUTION_TOO_LOW') {
        status = 'INVALID_IMAGE'
      }

      return {
        success: false,
        status: status,
        timing: {
          total: Date.now() - startTime
        }
      }
    }
  }

  // --- STUBS FOR FUTURE STAGES (To fix build errors in Dashboard / Lab) ---
  static async logRecognition(result: any, type: string) {}
  static async getRecognitionHistory() { return [] }
  static async getAnalyticsStats() { return {} }
}
