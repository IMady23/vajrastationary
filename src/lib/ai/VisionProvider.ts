export interface Prediction {
  name: string
  brand: string
  category: string
  confidence: number
}

export interface VisionProviderResult {
  predictions: Prediction[]
  rawResponseJson: any
  visionTimeMs: number
}

/**
 * Provider-agnostic interface for AI visual product recognition.
 * Implementations (e.g., GeminiVisionProvider, OpenAIVisionProvider, LocalVisionProvider)
 * return top predictions without exposing pricing or stock details.
 */
export interface VisionProvider {
  /**
   * Predicts top product matches from base64 image data and returns diagnostic metadata
   */
  predictTop3(base64Image: string, mimeType?: string): Promise<VisionProviderResult>
}
