import { type Product } from '../../types'
import { LearningService } from '../../services/LearningService'

export interface UserCorrectionEntry {
  predictedNameNorm: string
  correctedProductId: string
  frequency: number
  lastCorrectedAt: string
}

const LEARNING_STORAGE_KEY = 'vajra_ai_learning_corrections_v1'

/**
 * Self-improving Learning Service for Vajra Smart Recognition Engine.
 * Records when a user corrects an AI prediction and prioritizes that correction on future scans.
 */
export class RecognitionLearningService {
  private static localMap: Record<string, UserCorrectionEntry> | null = null

  private static loadLocalMap(): Record<string, UserCorrectionEntry> {
    if (this.localMap) return this.localMap
    try {
      const raw = localStorage.getItem(LEARNING_STORAGE_KEY)
      this.localMap = raw ? JSON.parse(raw) : {}
    } catch {
      this.localMap = {}
    }
    return this.localMap!
  }

  private static saveLocalMap(map: Record<string, UserCorrectionEntry>): void {
    this.localMap = map
    try {
      localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(map))
    } catch {
      // localStorage quota or error
    }
  }

  /**
   * Records a user correction when the user selects a product different from #1 AI prediction
   */
  static async recordCorrection(predictedName: string, selectedProduct: Product): Promise<void> {
    if (!predictedName || !selectedProduct?.id) return
    const key = this.normalizeKey(predictedName)
    const map = this.loadLocalMap()

    const existing = map[key]
    const nextFreq = existing ? existing.frequency + 1 : 1

    map[key] = {
      predictedNameNorm: key,
      correctedProductId: selectedProduct.id,
      frequency: nextFreq,
      lastCorrectedAt: new Date().toISOString(),
    }
    this.saveLocalMap(map)

    // Also persist to Firestore LearningService asynchronously
    try {
      await LearningService.recordCorrection(
        predictedName,
        selectedProduct.id,
        selectedProduct.name
      )
    } catch {
      // Ignore network errors, local learning map persists
    }
  }

  /**
   * Returns a score boost (0.0 to 0.35) if candidateProduct was previously selected as a correction for predictedName
   */
  static getCorrectionBoost(predictedName: string, candidateProduct: Product): number {
    if (!predictedName || !candidateProduct?.id) return 0
    const key = this.normalizeKey(predictedName)
    const map = this.loadLocalMap()
    const entry = map[key]
    if (entry && entry.correctedProductId === candidateProduct.id) {
      return Math.min(0.35, 0.15 + entry.frequency * 0.05)
    }
    return 0
  }

  private static normalizeKey(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim()
  }
}
