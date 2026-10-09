import { StorageService } from '../services/StorageService'

export const PRODUCT_IMAGES_BUCKET = 'product-images'

/**
 * Converts File to Base64 DataURL (used as instant fallback if offline)
 */
export function fileToDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads a single product image to Firebase Storage.
 * Returns public URL upon success, or falls back gracefully to DataURL.
 */
export async function uploadProductImage(file: File): Promise<string> {
  try {
    return await StorageService.saveProductImage('temp_' + Date.now(), file, 'front')
  } catch (err) {
    console.warn('Error uploading image, using local fallback:', err)
    return await fileToDataURL(file)
  }
}

/**
 * Uploads multiple product images and returns array of image URLs
 */
export async function uploadProductImages(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(file => uploadProductImage(file))
  return Promise.all(uploadPromises)
}
