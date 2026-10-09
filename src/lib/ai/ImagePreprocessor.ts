export const AI_PIPELINE_VERSION = {
  gemini_version: 'gemini-1.5-flash',
  prompt_version: 'v3.1-stationery-focus',
  engine_version: '3.2.0',
}

export interface OptimizedImage {
  blob: Blob
  dataUrl: string
  originalDataUrl: string
  adaptiveCropDataUrl: string
  base64Data: string
  mimeType: string
  imageHash: string
  width: number
  height: number
  preprocessTimeMs: number
  blurVariance: number
}

export interface OptimizeOptions {
  maxDimension?: number
  quality?: number
  cropPercentage?: number // e.g. 75 means keep central 75% width & height
  blurCheck?: boolean
  blurVarianceThreshold?: number // Default threshold ~35
}

/**
 * Image optimization & preprocessing service.
 * Automatically center-crops, checks for motion blur, resizes, compresses, formats base64, and computes perceptual hash.
 */
export class ImagePreprocessor {
  /**
   * Optimizes an input File or Blob for fast recognition and reduced background clutter.
   */
  static async optimizeImage(
    input: File | Blob | string,
    options: OptimizeOptions = {}
  ): Promise<OptimizedImage> {
    const startTime = performance.now()
    const maxDimension = options.maxDimension ?? 1024
    const quality = options.quality ?? 0.82
    const cropPercent = options.cropPercentage ?? 75
    const shouldCheckBlur = options.blurCheck ?? true
    const blurThreshold = options.blurVarianceThreshold ?? 35

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          // 1. Capture Original DataURL for side-by-side debug comparison
          const originalCanvas = document.createElement('canvas')
          originalCanvas.width = img.width
          originalCanvas.height = img.height
          const origCtx = originalCanvas.getContext('2d')
          if (!origCtx) throw new Error('Canvas 2D context not available')
          origCtx.drawImage(img, 0, 0)
          const originalDataUrl = originalCanvas.toDataURL('image/jpeg', 0.85)

          // 2. Configurable Center Crop (e.g. 75%) to isolate product from shelves/background
          const clampCrop = Math.min(100, Math.max(30, cropPercent)) / 100
          const srcWidth = Math.round(img.width * clampCrop)
          const srcHeight = Math.round(img.height * clampCrop)
          const srcX = Math.round((img.width - srcWidth) / 2)
          const srcY = Math.round((img.height - srcHeight) / 2)

          // 3. Compute output dimensions
          let outWidth = srcWidth
          let outHeight = srcHeight
          if (outWidth > maxDimension || outHeight > maxDimension) {
            const ratio = Math.min(maxDimension / outWidth, maxDimension / outHeight)
            outWidth = Math.round(outWidth * ratio)
            outHeight = Math.round(outHeight * ratio)
          }

          const canvas = document.createElement('canvas')
          canvas.width = outWidth
          canvas.height = outHeight

          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas 2D context not available')

          ctx.drawImage(
            img,
            srcX,
            srcY,
            srcWidth,
            srcHeight,
            0,
            0,
            outWidth,
            outHeight
          )

          // 4. Check Blur Variance (Laplacian Edge Detection)
          const blurVariance = ImagePreprocessor.computeBlurVariance(ctx, outWidth, outHeight)
          if (shouldCheckBlur && blurVariance < blurThreshold) {
            throw new Error(
              'BLURRY_IMAGE: The image is too blurry. Please hold the product closer and try again.'
            )
          }

          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          const base64Data = dataUrl.split(',')[1] || ''

          // 5. Compute fast perceptual hash (8x8 grayscale average binary hash)
          const imageHash = ImagePreprocessor.computePerceptualHash(img)

          // Convert DataURL to Blob
          const byteString = atob(base64Data)
          const ab = new ArrayBuffer(byteString.length)
          const ia = new Uint8Array(ab)
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i)
          }
          const blob = new Blob([ab], { type: 'image/jpeg' })
          const preprocessTimeMs = Math.round(performance.now() - startTime)

          resolve({
            blob,
            dataUrl,
            originalDataUrl,
            adaptiveCropDataUrl: dataUrl,
            base64Data,
            mimeType: 'image/jpeg',
            imageHash,
            width: outWidth,
            height: outHeight,
            preprocessTimeMs,
            blurVariance,
          })
        } catch (err) {
          reject(err)
        }
      }

      img.onerror = (err) => reject(new Error('Failed to load image for optimization: ' + err))

      if (typeof input === 'string') {
        img.src = input
      } else {
        const reader = new FileReader()
        reader.onload = () => {
          img.src = String(reader.result)
        }
        reader.onerror = () => reject(new Error('Failed to read input blob'))
        reader.readAsDataURL(input)
      }
    })
  }

  /**
   * Computes approximate Laplacian variance to detect severe motion blur
   */
  static computeBlurVariance(ctx: CanvasRenderingContext2D, width: number, height: number): number {
    try {
      const sampleW = Math.min(width, 160)
      const sampleH = Math.min(height, 160)
      const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data
      const grays = new Float32Array(sampleW * sampleH)

      for (let i = 0, j = 0; i < imgData.length; i += 4, j++) {
        grays[j] = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]
      }

      // 3x3 Laplacian approximation
      const laplacians: number[] = []
      let sum = 0
      for (let y = 1; y < sampleH - 1; y++) {
        for (let x = 1; x < sampleW - 1; x++) {
          const idx = y * sampleW + x
          const val =
            -4 * grays[idx] +
            grays[idx - 1] +
            grays[idx + 1] +
            grays[idx - sampleW] +
            grays[idx + sampleW]
          laplacians.push(val)
          sum += val
        }
      }

      if (laplacians.length === 0) return 100
      const mean = sum / laplacians.length
      let varianceSum = 0
      for (let i = 0; i < laplacians.length; i++) {
        const diff = laplacians[i] - mean
        varianceSum += diff * diff
      }
      return Math.round(varianceSum / laplacians.length)
    } catch {
      return 100
    }
  }

  /**
   * Computes an 8x8 average perceptual hash string (64-bit hex representation)
   */
  static computePerceptualHash(img: HTMLImageElement): string {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 8
      canvas.height = 8
      const ctx = canvas.getContext('2d')
      if (!ctx) return ''

      ctx.drawImage(img, 0, 0, 8, 8)
      const imgData = ctx.getImageData(0, 0, 8, 8).data

      const grays: number[] = []
      let total = 0
      for (let i = 0; i < imgData.length; i += 4) {
        const gray = Math.round(0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2])
        grays.push(gray)
        total += gray
      }

      const avg = total / grays.length
      let binaryStr = ''
      for (const g of grays) {
        binaryStr += g >= avg ? '1' : '0'
      }

      // Convert 64-bit binary string to hex
      let hexHash = ''
      for (let i = 0; i < binaryStr.length; i += 4) {
        const chunk = binaryStr.substring(i, i + 4)
        hexHash += parseInt(chunk, 2).toString(16)
      }

      return hexHash
    } catch (e) {
      return ''
    }
  }

  /**
   * Computes Hamming distance between two hex hashes (0 = identical, higher = more different)
   */
  static hashHammingDistance(hash1: string, hash2: string): number {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) return 999
    let distance = 0
    for (let i = 0; i < hash1.length; i++) {
      const b1 = parseInt(hash1[i], 16).toString(2).padStart(4, '0')
      const b2 = parseInt(hash2[i], 16).toString(2).padStart(4, '0')
      for (let j = 0; j < 4; j++) {
        if (b1[j] !== b2[j]) distance++
      }
    }
    return distance
  }
}
