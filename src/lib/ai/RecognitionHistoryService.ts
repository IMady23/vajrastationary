import { type RecognitionHistoryItem, type RecognitionSource } from '../../types'
import { RecognitionService, type AIAnalyticsStats } from '../../services/RecognitionService'
import { StorageService } from '../../services/StorageService'

export { type AIAnalyticsStats }

export class RecognitionHistoryService {
  /**
   * Uploads captured scan image to Firebase Storage or returns Data URL fallback
   */
  static async uploadCaptureImage(imageBlob: Blob): Promise<string> {
    try {
      return await StorageService.saveRecognitionScan(imageBlob)
    } catch {
      return ''
    }
  }

  /**
   * Logs recognition scan via Firebase RecognitionService
   */
  static async logRecognition(item: {
    capturedImageBlob: Blob
    predictedName: string
    selectedProductId?: string | null
    confidence: number
    recognitionSource: RecognitionSource
    recognitionTimeMs: number
    device?: string
    userCorrected?: boolean
    userAccepted?: boolean
    matched?: boolean
    failureReason?: string | null
  }): Promise<RecognitionHistoryItem | null> {
    try {
      const imageUrl = await RecognitionHistoryService.uploadCaptureImage(item.capturedImageBlob)

      const row: RecognitionHistoryItem = {
        captured_image: imageUrl,
        predicted_name: item.predictedName,
        selected_product_id: item.selectedProductId || null,
        confidence: item.confidence,
        recognition_source: item.recognitionSource,
        recognition_time_ms: item.recognitionTimeMs,
        device: item.device || 'desktop',
        user_corrected: Boolean(item.userCorrected),
        user_accepted: item.userAccepted ?? Boolean(item.matched),
        matched: Boolean(item.matched),
        failure_reason: item.failureReason || null,
        created_at: new Date().toISOString(),
      }

      await RecognitionService.logRecognition({
        image_url: imageUrl,
        product_id: item.selectedProductId,
        confidence: item.confidence,
        matched_name: item.predictedName,
        status: item.userAccepted ? 'correct' : 'incorrect',
        recognition_source: 'gemini_vision',
        latency_ms: item.recognitionTimeMs
      })

      return row
    } catch {
      return null
    }
  }

  /**
   * Fetches recent activity log via Firebase RecognitionService
   */
  static async getRecentActivity(limit = 10): Promise<RecognitionHistoryItem[]> {
    return await RecognitionService.getRecognitionHistory(limit)
  }

  /**
   * Computes comprehensive AI Analytics stats via Firebase RecognitionService
   */
  static async getAnalyticsStats(): Promise<AIAnalyticsStats> {
    return await RecognitionService.getAnalyticsStats()
  }
}
