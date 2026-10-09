import { type Product } from '../../types'
import { RecognitionEngine, type RecognitionEngineResult, type SuggestionItem } from './RecognitionEngine'
import { RecognitionHistoryService } from './RecognitionHistoryService'
import { RecognitionLearningService } from './RecognitionLearningService'

export type SuggestionMatch = SuggestionItem
export type AIRecognitionResult = RecognitionEngineResult

export class AIRecognitionController {
  static async runPipeline(
    inputImage: Blob | File | string,
    allProducts: Product[]
  ): Promise<AIRecognitionResult> {
    return RecognitionEngine.runPipeline(inputImage, allProducts)
  }

  static async recordUserSelection(params: {
    result: AIRecognitionResult
    selectedSuggestionIndex: number
    userCorrected?: boolean
    failureReason?: string | null
  }): Promise<void> {
    const chosen = params.result.suggestions[params.selectedSuggestionIndex]

    if (!chosen) {
      // Log recognition failure
      await RecognitionHistoryService.logRecognition({
        capturedImageBlob: params.result.optimizedImage.blob,
        predictedName: 'UNKNOWN',
        selectedProductId: null,
        confidence: 0,
        recognitionSource: params.result.source,
        recognitionTimeMs: params.result.timeTakenMs,
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        userCorrected: false,
        userAccepted: false,
        matched: false,
        failureReason: params.failureReason || 'UNKNOWN_PRODUCT',
      })
      return
    }

    // If user corrected #1 prediction, learn it via RecognitionLearningService
    if (params.selectedSuggestionIndex > 0 && chosen.matchedProduct) {
      const predictedTop = params.result.suggestions[0]?.prediction.name
      if (predictedTop) {
        await RecognitionLearningService.recordCorrection(predictedTop, chosen.matchedProduct)
      }
    }

    await RecognitionHistoryService.logRecognition({
      capturedImageBlob: params.result.optimizedImage.blob,
      predictedName: chosen.prediction.name,
      selectedProductId: chosen.matchedProduct?.id || null,
      confidence: chosen.prediction.confidence,
      recognitionSource: params.result.source,
      recognitionTimeMs: params.result.timeTakenMs,
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      userCorrected: params.userCorrected,
      userAccepted: Boolean(chosen.matchedProduct),
      matched: Boolean(chosen.matchedProduct),
      failureReason: params.failureReason || null,
    })
  }
}
