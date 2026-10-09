import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  increment,
  writeBatch,
  setDoc,
  limit
} from 'firebase/firestore'
import { db, COLLECTIONS } from '../firebase/firestore'
import { type Product, normalizeProduct } from '../types'

export class ProductService {
  private static get collectionRef() {
    return collection(db, COLLECTIONS.PRODUCTS)
  }

  /**
   * Generates a new Firestore document ID for a product
   */
  static generateId(): string {
    return doc(this.collectionRef).id
  }

  /**
   * Auto-generates an internal SKU (e.g., VAJ-000001)
   */
  static async generateSKU(): Promise<string> {
    const q = query(this.collectionRef, orderBy('sku', 'desc'), limit(1))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return 'VAJ-000001'
    }
    
    const lastProduct = snapshot.docs[0].data()
    const lastSku = lastProduct.sku || 'VAJ-000000'
    const lastNum = parseInt(lastSku.replace('VAJ-', ''), 10)
    
    if (isNaN(lastNum)) return `VAJ-${Math.floor(Math.random() * 1000000)}`
    
    const nextNum = lastNum + 1
    return `VAJ-${String(nextNum).padStart(6, '0')}`
  }

  /**
   * Generates a canonical name from AI structured output or raw strings.
   * e.g., brand: 'Cello', model: 'Trimax', variant: 'Blue' => 'cello-trimax-blue'
   */
  static generateCanonicalName(brand?: string | null, model?: string | null, variant?: string | null, name?: string): string {
    if (brand || model || variant) {
      const parts = [brand, model, variant].filter(Boolean)
      return parts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '')
    }
    
    // Fallback if structured data is missing
    if (name) {
      return name.toLowerCase().replace(/[^a-z0-9]/g, '')
    }
    
    return `unknown-${Date.now()}`
  }

  /**
   * AI Matching Engine (Hierarchy: Barcode -> SKU -> Canonical -> Fuzzy)
   */
  static async findMatchingProduct(prediction: any): Promise<Product | null> {
    const { barcode, sku, brand, model, variant, name } = prediction

    // 1. Barcode Match (Always wins)
    if (barcode) {
      const byBarcode = await this.searchByBarcode(barcode)
      if (byBarcode) return byBarcode
    }

    // 2. SKU Match
    if (sku) {
      const bySku = await this.searchBySKU(sku)
      if (bySku) return bySku
    }

    // 3. Canonical Match
    const canonicalName = this.generateCanonicalName(brand, model, variant, name)
    const q = query(this.collectionRef, where('canonical_name', '==', canonicalName))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      return normalizeProduct({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
    }

    // 4. Lightweight Fuzzy Match (fallback)
    const searchName = name?.toLowerCase().trim() || ''
    if (searchName) {
      const allProducts = await this.getProducts()
      for (const p of allProducts) {
        if (p.product_name.toLowerCase().includes(searchName) || searchName.includes(p.product_name.toLowerCase())) {
          return p
        }
      }
    }

    return null
  }

  static async searchByBarcode(barcode: string): Promise<Product | null> {
    const q = query(this.collectionRef, where('barcode', '==', barcode))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return normalizeProduct({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
  }

  static async searchBySKU(sku: string): Promise<Product | null> {
    const q = query(this.collectionRef, where('sku', '==', sku))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return normalizeProduct({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
  }

  static async getProducts(): Promise<Product[]> {
    const q = query(this.collectionRef, orderBy('product_name', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(docSnap => normalizeProduct({ id: docSnap.id, ...docSnap.data() }))
  }

  static async getProductById(id: string): Promise<Product | null> {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, id)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    return normalizeProduct({ id: docSnap.id, ...docSnap.data() })
  }

  static async createProduct(productData: Partial<Product> & { id?: string }): Promise<Product> {
    const now = new Date().toISOString()
    
    let sku = productData.sku
    if (!sku) {
      sku = await this.generateSKU()
    }

    const canonical_name = this.generateCanonicalName(
      productData.brand, 
      productData.model, 
      productData.variant, 
      productData.product_name || productData.name
    )

    const payload = {
      product_name: productData.product_name || productData.name || '',
      canonical_name,
      brand: productData.brand || null,
      model: productData.model || null,
      variant: productData.variant || null,
      category: productData.category || 'Others',
      subcategory: productData.subcategory || null,
      unit: productData.unit || 'pcs',
      barcode: productData.barcode || null,
      sku,
      image_url: productData.image_url || productData.primary_image || null,
      status: productData.status || 'ACTIVE',
      // Store here for backward compatibility
      selling_price: Number(productData.selling_price ?? productData.price ?? 0),
      current_stock: Number(productData.current_stock ?? productData.quantity ?? productData.stock ?? 0),
      minimum_stock: Number(productData.minimum_stock ?? 0),
      created_at: now,
      updated_at: now
    }

    if (productData.id) {
      const docRef = doc(db, COLLECTIONS.PRODUCTS, productData.id)
      await setDoc(docRef, payload)
      return normalizeProduct({ id: docRef.id, ...payload })
    } else {
      const docRef = await addDoc(this.collectionRef, payload)
      return normalizeProduct({ id: docRef.id, ...payload })
    }
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, id)
    const payload: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.product_name !== undefined || updates.name !== undefined) {
      payload.product_name = updates.product_name || updates.name
    }
    if (updates.brand !== undefined) payload.brand = updates.brand
    if (updates.model !== undefined) payload.model = updates.model
    if (updates.variant !== undefined) payload.variant = updates.variant
    if (updates.category !== undefined) payload.category = updates.category
    
    // Regenerate canonical if needed
    if (updates.brand !== undefined || updates.model !== undefined || updates.variant !== undefined || updates.product_name !== undefined) {
       // We can't perfectly regenerate without the other fields, so we only update if provided explicitly
    }

    if (updates.selling_price !== undefined || updates.price !== undefined) {
      payload.selling_price = Number(updates.selling_price ?? updates.price)
    }
    if (updates.current_stock !== undefined || updates.quantity !== undefined || updates.stock !== undefined) {
      payload.current_stock = Number(updates.current_stock ?? updates.quantity ?? updates.stock)
      payload.status = payload.current_stock <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE'
    }
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.image_url !== undefined || updates.primary_image !== undefined) {
      payload.image_url = updates.image_url || updates.primary_image
    }
    if (updates.barcode !== undefined) payload.barcode = updates.barcode
    if (updates.sku !== undefined) payload.sku = updates.sku
    if (updates.minimum_stock !== undefined) payload.minimum_stock = updates.minimum_stock

    await updateDoc(docRef, payload)
  }

  static async deleteProduct(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, id)
    await deleteDoc(docRef)
  }

  static async incrementScanCount(id: string): Promise<void> {
    // Deprecated. We use ScanHistory collection now, but left for backward compatibility.
  }

  static async reduceStock(items: { id: string; quantity: number }[]): Promise<void> {
    if (!items.length) return
    const batch = writeBatch(db)
    for (const item of items) {
      if (!item.id || item.id === 'none') continue
      const docRef = doc(db, COLLECTIONS.PRODUCTS, item.id)
      batch.update(docRef, {
        current_stock: increment(-item.quantity)
      })
    }
    await batch.commit()
  }

  static async searchProducts(queryText: string): Promise<Product[]> {
    const allProducts = await this.getProducts()
    const q = queryText.toLowerCase().trim()
    if (!q) return allProducts
    return allProducts.filter(p =>
      p.product_name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    )
  }
}
