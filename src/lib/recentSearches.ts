import { type Product } from '../types'

const RECENT_SEARCHES_KEY = 'vajra_recent_searches'
const MAX_RECENT = 8

export function addRecentSearch(product: Product): void {
  try {
    const existing = getRecentSearches()
    const filtered = existing.filter((p) => p.id !== product.id)
    const updated = [product, ...filtered].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Error saving recent search:', err)
  }
}

export function getRecentSearches(): Product[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (err) {
    return []
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch (e) {
    // ignore
  }
}
