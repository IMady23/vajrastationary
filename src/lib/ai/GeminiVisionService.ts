import { GeminiVisionProvider } from './GeminiVisionProvider'
import { type Prediction } from './VisionProvider'

export type GeminiPrediction = Prediction

export class GeminiVisionService {
  private static provider = new GeminiVisionProvider()

  static async predictTop3(base64Data: string, mimeType = 'image/jpeg'): Promise<Prediction[]> {
    const res = await this.provider.predictTop3(base64Data, mimeType)
    return res.predictions
  }
}
