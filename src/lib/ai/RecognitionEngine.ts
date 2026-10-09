import { type Product, type RecognitionSource } from '../../types'
import { ImagePreprocessor, type OptimizedImage, type OptimizeOptions } from './ImagePreprocessor'
import { LocalImageMatcher } from './LocalImageMatcher'
import { GeminiVisionProvider } from './GeminiVisionProvider'
import { type VisionProvider, type Prediction } from './VisionProvider'
import { DatabaseMatcher, type CandidateBreakdown } from './DatabaseMatcher'
import { RecognitionCache } from './RecognitionCache'

export type RecognitionAction = 'AUTO_SELECT' | 'TOP_THREE' | 'UNKNOWN'

export interface SuggestionItem {
  prediction: Prediction
  matchedProduct: Product | null
  matchScore: number
  breakdown?: CandidateBreakdown
}

export interface RecognitionTimingBreakdown {
  preprocessMs: number
  visionMs: number
  databaseMs: number
  totalMs: number
}

export interface RecognitionDebugInfo {
  originalDataUrl: string
  processedDataUrl: string
  blurVariance: number
  rawGeminiJson: any
  candidateBreakdowns: CandidateBreakdown[]
  timing: RecognitionTimingBreakdown
  decisionReason: string
}

export interface RecognitionEngineResult {
  optimizedImage: OptimizedImage
  source: RecognitionSource
  timeTakenMs: number
  action: RecognitionAction
  suggestions: SuggestionItem[]
  primaryMatchProduct?: Product | null
  debugInfo: RecognitionDebugInfo
}

/**
 * Hardened Recognition Engine with Dual-Gate thresholds and transparent Debug payload.
 */
export class RecognitionEngine {
  private static visionProvider: VisionProvider = new GeminiVisionProvider()

  static setVisionProvider(provider: VisionProvider): void {
    this.visionProvider = provider
  }

  static async runPipeline(
    inputImage: Blob | File | string,
    allProducts: Product[],
    options?: OptimizeOptions
  ): Promise<RecognitionEngineResult> {
    const pipelineStart = performance.now()

    // 1. Image Preprocessing (Center crop & blur precheck)
    const optimized = await ImagePreprocessor.optimizeImage(inputImage, options)

    // 2. Check 15-Minute TTL Cache
    const cached = RecognitionCache.get(optimized.imageHash)
    if (cached && cached.predictions.length > 0) {
      const dbStart = performance.now()
      const breakdowns: CandidateBreakdown[] = []
      const suggestions: SuggestionItem[] = cached.predictions.map((pred) => {
        const dbMatch = DatabaseMatcher.matchProduct(pred.name, pred.brand, pred.category, allProducts)
        if (dbMatch?.breakdown) breakdowns.push(dbMatch.breakdown)
        return {
          prediction: pred,
          matchedProduct: dbMatch ? dbMatch.product : null,
          matchScore: dbMatch ? dbMatch.matchScore : 0,
          breakdown: dbMatch?.breakdown,
        }
      })
      const databaseMs = Math.round(performance.now() - dbStart)
      const totalMs = Math.round(performance.now() - pipelineStart)

      const topConfidence = suggestions[0]?.prediction.confidence || 0
      const topScore = suggestions[0]?.matchScore || 0
      const { action, reason } = this.classifyDualGate(topConfidence, topScore, suggestions[0]?.matchedProduct)

      return {
        optimizedImage: optimized,
        source: 'CACHED',
        timeTakenMs: totalMs,
        action,
        suggestions,
        primaryMatchProduct: suggestions[0]?.matchedProduct || null,
        debugInfo: {
          originalDataUrl: optimized.originalDataUrl,
          processedDataUrl: optimized.dataUrl,
          blurVariance: optimized.blurVariance,
          rawGeminiJson: { source: '15m TTL Cache', cachedAt: new Date(cached.timestamp).toISOString() },
          candidateBreakdowns: breakdowns,
          timing: {
            preprocessMs: optimized.preprocessTimeMs,
            visionMs: 0,
            databaseMs,
            totalMs,
          },
          decisionReason: reason,
        },
      }
    }

    // 3. Check Local Visual Signature Match
    const localMatch = LocalImageMatcher.matchLocally(optimized.imageHash, allProducts)
    if (localMatch && localMatch.confidence >= 0.9) {
      const totalMs = Math.round(performance.now() - pipelineStart)
      const pred: Prediction = {
        name: localMatch.product.name,
        brand: localMatch.product.brand || '',
        category: localMatch.product.category,
        confidence: localMatch.confidence,
      }

      RecognitionCache.set(optimized.imageHash, [pred], localMatch.product.id, 'LOCAL')

      return {
        optimizedImage: optimized,
        source: 'LOCAL',
        timeTakenMs: totalMs,
        action: 'AUTO_SELECT',
        suggestions: [
          {
            prediction: pred,
            matchedProduct: localMatch.product,
            matchScore: 1.0,
          },
        ],
        primaryMatchProduct: localMatch.product,
        debugInfo: {
          originalDataUrl: optimized.originalDataUrl,
          processedDataUrl: optimized.dataUrl,
          blurVariance: optimized.blurVariance,
          rawGeminiJson: { source: 'Local Perceptual Hash Match (Hamming distance == 0)' },
          candidateBreakdowns: [],
          timing: {
            preprocessMs: optimized.preprocessTimeMs,
            visionMs: 0,
            databaseMs: 1,
            totalMs,
          },
          decisionReason: 'Local Image Signature Exact Match',
        },
      }
    }

    // 4. Execute Vision Provider (No mock data fallback)
    const visionRes = await this.visionProvider.predictTop3(optimized.base64Data, optimized.mimeType)
    const predictions = visionRes.predictions

    // 5. Database Fuzzy Matching
    const dbStart = performance.now()
    const breakdowns: CandidateBreakdown[] = []
    const suggestions: SuggestionItem[] = predictions.map((pred) => {
      const dbMatch = DatabaseMatcher.matchProduct(pred.name, pred.brand, pred.category, allProducts)
      if (dbMatch?.breakdown) breakdowns.push(dbMatch.breakdown)
      return {
        prediction: pred,
        matchedProduct: dbMatch ? dbMatch.product : null,
        matchScore: dbMatch ? dbMatch.matchScore : 0,
        breakdown: dbMatch?.breakdown,
      }
    })
    const databaseMs = Math.round(performance.now() - dbStart)
    const totalMs = Math.round(performance.now() - pipelineStart)

    const primaryMatch = suggestions[0]?.matchedProduct || null
    if (predictions.length > 0 && primaryMatch) {
      RecognitionCache.set(optimized.imageHash, predictions, primaryMatch.id, 'GEMINI')
    }

    const topConfidence = suggestions[0]?.prediction.confidence || 0
    const topScore = suggestions[0]?.matchScore || 0
    const { action, reason } = this.classifyDualGate(topConfidence, topScore, primaryMatch)

    return {
      optimizedImage: optimized,
      source: 'GEMINI',
      timeTakenMs: totalMs,
      action,
      suggestions,
      primaryMatchProduct: primaryMatch,
      debugInfo: {
        originalDataUrl: optimized.originalDataUrl,
        processedDataUrl: optimized.dataUrl,
        blurVariance: optimized.blurVariance,
        rawGeminiJson: visionRes.rawResponseJson,
        candidateBreakdowns: breakdowns,
        timing: {
          preprocessMs: optimized.preprocessTimeMs,
          visionMs: visionRes.visionTimeMs,
          databaseMs,
          totalMs,
        },
        decisionReason: reason,
      },
    }
  }

  /**
   * Dual-Gate Threshold Rule:
   * Auto-Select requires AI Confidence >= 0.95 AND Database Match Score >= 0.65
   */
  private static classifyDualGate(
    aiConfidence: number,
    dbScore: number,
    matchedProduct: Product | null | undefined
  ): { action: RecognitionAction; reason: string } {
    if (!matchedProduct || aiConfidence < 0.85 || dbScore < 0.45) {
      return {
        action: 'UNKNOWN',
        reason:
          !matchedProduct
            ? 'No inventory match found'
            : `Low Confidence/DB Score (AI: ${Math.round(aiConfidence * 100)}%, DB: ${Math.round(dbScore * 100)}%)`,
      }
    }

    if (aiConfidence >= 0.95 && dbScore >= 0.65) {
      return {
        action: 'AUTO_SELECT',
        reason: `Dual-Gate Passed (AI: ${Math.round(aiConfidence * 100)}%, DB: ${Math.round(dbScore * 100)}%)`,
      }
    }

    return {
      action: 'TOP_THREE',
      reason: `Moderate Confidence requiring user verification (AI: ${Math.round(aiConfidence * 100)}%, DB: ${Math.round(dbScore * 100)}%)`,
    }
  }

  static async recognizeMultipleProducts(): Promise<void> {
    // Reserved Stage 5 Hook
  }
}
