import { uploadProductImage, uploadRecognitionScan } from '../firebase/storage'

export class StorageService {
  /**
   * Uploads a product image to structured Firebase Storage path:
   * products/{productId}/{angle}_{timestamp}.jpg
   */
  static async saveProductImage(productId: string, dataUrlOrBlob: string | Blob, angle: string = 'front'): Promise<string> {
    return await uploadProductImage(productId, dataUrlOrBlob, angle)
  }

  /**
   * Uploads a captured recognition scan to structured chronological Firebase Storage path:
   * recognitions/YYYY/MonthName/scan_{timestamp}.jpg
   */
  static async saveRecognitionScan(dataUrlOrBlob: string | Blob): Promise<string> {
    return await uploadRecognitionScan(dataUrlOrBlob)
  }
}
