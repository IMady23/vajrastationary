import { type Product } from '../../types'
import { RecognitionLearningService } from './RecognitionLearningService'

export interface CandidateBreakdown {
  productId: string
  productName: string
  brand: string
  category: string
  nameScore: number
  brandScore: number
  categoryScore: number
  learningBoost: number
  scanBoost: number
  totalScore: number
}

export interface DatabaseMatchResult {
  product: Product
  matchScore: number // 0.00 to 1.00
  matchReason: string
  breakdown: CandidateBreakdown
}

export class DatabaseMatcher {
  /**
   * Performs fuzzy matching against local inventory products.
   * Returns top matching product and granular scoring breakdown.
   */
  static matchProduct(
    predictedName: string,
    predictedBrand: string | undefined,
    predictedCategory: string | undefined,
    allProducts: Product[]
  ): DatabaseMatchResult | null {
    if (!predictedName || allProducts.length === 0) return null

    const targetNameNorm = DatabaseMatcher.normalizeText(predictedName)
    const targetTokens = targetNameNorm.split(' ').filter(Boolean)
    const targetBrandNorm = predictedBrand ? DatabaseMatcher.normalizeText(predictedBrand) : ''

    let bestProduct: Product | null = null
    let bestScore = 0
    let bestReason = ''
    let bestBreakdown: CandidateBreakdown | null = null

    for (const p of allProducts) {
      const pNameNorm = DatabaseMatcher.normalizeText(p.name)
      const pTokens = pNameNorm.split(' ').filter(Boolean)
      const pBrandNorm = p.brand ? DatabaseMatcher.normalizeText(p.brand) : ''

      // Check self-improving user correction boost
      const learningBoost = Number(RecognitionLearningService.getCorrectionBoost(predictedName, p).toFixed(2))

      // Exact normalized name match
      if (pNameNorm === targetNameNorm) {
        return {
          product: p,
          matchScore: 1.0,
          matchReason: 'Exact inventory name match',
          breakdown: {
            productId: p.id,
            productName: p.name,
            brand: p.brand || '',
            category: p.category,
            nameScore: 1.0,
            brandScore: 0,
            categoryScore: 0,
            learningBoost,
            scanBoost: 0,
            totalScore: 1.0,
          },
        }
      }

      // Token overlap score
      let matchedTokens = 0
      for (const token of targetTokens) {
        if (token.length > 2 && pTokens.some((pt) => pt.includes(token) || token.includes(pt))) {
          matchedTokens++
        }
      }

      let nameScore = targetTokens.length > 0 ? Number((matchedTokens / targetTokens.length).toFixed(2)) : 0
      if (pNameNorm.includes(targetNameNorm) || targetNameNorm.includes(pNameNorm)) {
        nameScore = Math.min(1.0, Number((nameScore + 0.22).toFixed(2)))
      }

      // Brand match bonus
      const brandScore = targetBrandNorm && pBrandNorm && targetBrandNorm === pBrandNorm ? 0.18 : 0

      // Category match bonus
      const categoryScore =
        predictedCategory && p.category.toLowerCase() === predictedCategory.toLowerCase() ? 0.10 : 0

      // Scan count (favorite products) boost up to +0.08
      const scanBoost =
        p.scan_count && p.scan_count > 0 ? Number(Math.min(0.08, p.scan_count * 0.01).toFixed(2)) : 0

      const totalScore = Number(
        Math.min(1.0, nameScore + brandScore + categoryScore + learningBoost + scanBoost).toFixed(2)
      )

      if (totalScore > bestScore) {
        bestScore = totalScore
        bestProduct = p
        const signals: string[] = []
        if (learningBoost > 0) signals.push('Learned User Correction')
        if (brandScore > 0) signals.push('Brand Match')
        if (categoryScore > 0) signals.push('Category Match')
        if (nameScore > 0.4) signals.push('Name Token Overlap')
        bestReason =
          signals.length > 0
            ? `${signals.join(' + ')} (${Math.round(totalScore * 100)}%)`
            : `Fuzzy similarity (${Math.round(totalScore * 100)}%)`
        bestBreakdown = {
          productId: p.id,
          productName: p.name,
          brand: p.brand || '',
          category: p.category,
          nameScore,
          brandScore,
          categoryScore,
          learningBoost,
          scanBoost,
          totalScore,
        }
      }
    }

    // Confident match threshold (≥ 45%)
    if (bestProduct && bestBreakdown && bestScore >= 0.45) {
      return {
        product: bestProduct,
        matchScore: bestScore,
        matchReason: bestReason,
        breakdown: bestBreakdown,
      }
    }

    return null
  }

  private static normalizeText(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
}
