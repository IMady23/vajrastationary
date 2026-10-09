import { type Product } from '../../types'
import { ImagePreprocessor } from './ImagePreprocessor'

export interface LocalMatchResult {
  product: Product
  confidence: number
  distance: number
}

/**
 * Performs local-first visual recognition by comparing perceptual image hashes
 * against inventory products already stored in Firestore.
 * Saves API calls and responds in < 50ms for previously recognized/scanned items!
 */
export class LocalImageMatcher {
  /**
   * Searches for a confident local match across current products.
   * Returns LocalMatchResult if Hamming distance <= threshold, otherwise null.
   */
  static matchLocally(
    targetHash: string,
    products: Product[],
    maxHammingThreshold = 6
  ): LocalMatchResult | null {
    if (!targetHash || targetHash.length === 0 || products.length === 0) return null

    let bestMatch: Product | null = null
    let lowestDistance = 999

    for (const p of products) {
      if (p.image_hash && p.image_hash.length > 0) {
        const dist = ImagePreprocessor.hashHammingDistance(targetHash, p.image_hash)
        if (dist < lowestDistance) {
          lowestDistance = dist
          bestMatch = p
        }
      }
    }

    if (bestMatch && lowestDistance <= maxHammingThreshold) {
      // Calculate confidence 0..1 based on Hamming distance out of 64 bits
      const confidence = Number(Math.max(0.85, 1 - lowestDistance / 64).toFixed(4))
      return {
        product: bestMatch,
        confidence,
        distance: lowestDistance,
      }
    }

    return null
  }
}
