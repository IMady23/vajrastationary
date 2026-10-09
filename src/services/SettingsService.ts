import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, COLLECTIONS } from '../firebase/firestore'
import { type InventorySettings } from '../types'

const DEFAULT_SETTINGS: InventorySettings = {
  shopName: 'Vajra Stationery & Xerox',
  address: '',
  upiId: '',
  whatsappMessage: 'Thank you for shopping with us!',
  taxRate: 0,
  isShopOpen: true,
  currency: 'INR',
  theme: 'dark'
}

export class SettingsService {
  private static readonly SETTINGS_DOC_ID = 'store_config'

  /**
   * Fetches current shop configuration from Firestore with localStorage fallback
   */
  static async getSettings(): Promise<InventorySettings> {
    try {
      const docRef = doc(db, COLLECTIONS.INVENTORY_SETTINGS, this.SETTINGS_DOC_ID)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data() as InventorySettings
        this.syncToLocalStorage(data)
        return { ...DEFAULT_SETTINGS, ...data }
      }
    } catch (err) {
      console.warn('Failed to fetch store settings from Firestore, using LocalStorage/Defaults:', err)
    }
    return this.getFromLocalStorage()
  }

  /**
   * Saves shop configuration to Firestore and LocalStorage
   */
  static async saveSettings(settings: Partial<InventorySettings>): Promise<InventorySettings> {
    const current = await this.getFromLocalStorage()
    const merged: InventorySettings = { ...DEFAULT_SETTINGS, ...current, ...settings }

    try {
      const docRef = doc(db, COLLECTIONS.INVENTORY_SETTINGS, this.SETTINGS_DOC_ID)
      await setDoc(docRef, merged, { merge: true })
    } catch (err) {
      console.warn('Failed to save store settings to Firestore:', err)
    }

    this.syncToLocalStorage(merged)
    return merged
  }

  private static syncToLocalStorage(settings: InventorySettings) {
    localStorage.setItem('vajra_shop_name', settings.shopName)
    if (settings.address) localStorage.setItem('vajra_shop_address', settings.address)
    if (settings.upiId) localStorage.setItem('vajra_shop_upi', settings.upiId)
    if (settings.whatsappMessage) localStorage.setItem('vajra_whatsapp_msg', settings.whatsappMessage)
    localStorage.setItem('vajra_tax_rate', String(settings.taxRate))
    localStorage.setItem('vajra_shop_status', settings.isShopOpen ? 'open' : 'closed')
    if (settings.theme) localStorage.setItem('vajra_theme', settings.theme)
  }

  private static getFromLocalStorage(): InventorySettings {
    return {
      shopName: localStorage.getItem('vajra_shop_name') || DEFAULT_SETTINGS.shopName,
      address: localStorage.getItem('vajra_shop_address') || DEFAULT_SETTINGS.address,
      upiId: localStorage.getItem('vajra_shop_upi') || DEFAULT_SETTINGS.upiId,
      whatsappMessage: localStorage.getItem('vajra_whatsapp_msg') || DEFAULT_SETTINGS.whatsappMessage,
      taxRate: Number(localStorage.getItem('vajra_tax_rate') || 0),
      isShopOpen: localStorage.getItem('vajra_shop_status') !== 'closed',
      currency: DEFAULT_SETTINGS.currency,
      theme: (localStorage.getItem('vajra_theme') as 'dark' | 'light') || 'dark'
    }
  }
}
