import { type Product } from '../../types'

export interface ProductRecognitionInput {
  imageBlob?: Blob | File
  imageUrl?: string
}

export interface ProductRecognitionPrediction {
  name?: string
  category?: string
  brand?: string
  shelf_location?: string
  confidence: number
  matchedProduct?: Product
}

/**
 * Architectural Service Contract for Phase 2 AI Product Recognition.
 * In Phase 2, this service will connect to a multimodal AI vision endpoint (e.g. Gemini Vision)
 * to predict stationery product details from captured shelf/camera photos.
 */
export class ProductRecognitionService {
  /**
   * Predicts product metadata from a captured image blob or URL.
   */
  static async recognizeProduct(input: ProductRecognitionInput): Promise<ProductRecognitionPrediction> {
    // Phase 1 architectural hook: returns structured placeholder / ready for Phase 2 AI plug-in
    console.log('[AI Product Recognition] Prepared Phase 2 input:', input)
    return {
      confidence: 0,
    }
  }
}
