import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  setDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore'
import { db, COLLECTIONS } from '../firebase/firestore'
import { type Sale, type Customer, type Expense } from '../types'

export class AnalyticsService {
  /* ======================== SALES & BILLING ======================== */
  static async getSales(maxItems: number = 100): Promise<Sale[]> {
    try {
      const q = query(collection(db, COLLECTIONS.SALES), orderBy('created_at', 'desc'), limit(maxItems))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Sale, 'id'>)
      }))
    } catch (err) {
      console.warn('Failed to fetch sales from Firestore:', err)
      return []
    }
  }

  static async createSale(saleData: Partial<Sale>): Promise<Sale> {
    const payload = {
      items: saleData.items || [],
      total: Number(saleData.total || 0),
      profit: Number(saleData.profit || 0),
      customer_phone: saleData.customer_phone || undefined,
      created_at: saleData.created_at || new Date().toISOString()
    }
    const docRef = await addDoc(collection(db, COLLECTIONS.SALES), payload)
    return { id: docRef.id, ...payload }
  }

  /* ======================== CUSTOMERS ======================== */
  static async getCustomers(): Promise<Customer[]> {
    try {
      const q = query(collection(db, COLLECTIONS.CUSTOMERS), orderBy('total_spent', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(docSnap => docSnap.data() as Customer)
    } catch (err) {
      console.warn('Failed to fetch customers:', err)
      return []
    }
  }

  static async saveCustomer(customer: Customer): Promise<Customer> {
    if (!customer.phone) throw new Error('Customer phone required')
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customer.phone)
    await setDoc(docRef, customer, { merge: true })
    return customer
  }

  /* ======================== EXPENSES ======================== */
  static async getExpenses(maxItems: number = 100): Promise<Expense[]> {
    try {
      const q = query(collection(db, COLLECTIONS.EXPENSES), orderBy('date', 'desc'), limit(maxItems))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Expense, 'id'>)
      }))
    } catch (err) {
      console.warn('Failed to fetch expenses:', err)
      return []
    }
  }

  static async createExpense(expenseData: Partial<Expense>): Promise<Expense> {
    const payload = {
      category: expenseData.category || 'General',
      amount: Number(expenseData.amount || 0),
      description: expenseData.description || '',
      date: expenseData.date || new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    const docRef = await addDoc(collection(db, COLLECTIONS.EXPENSES), payload)
    return { id: docRef.id, ...payload }
  }

  static async deleteExpense(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.EXPENSES, id)
    await deleteDoc(docRef)
  }

  /* ======================== DASHBOARD KPI AGGREGATION ======================== */
  static async getDashboardSummary(): Promise<{
    totalRevenue: number
    totalProfit: number
    totalExpenses: number
    netIncome: number
    salesCount: number
  }> {
    const [sales, expenses] = await Promise.all([this.getSales(500), this.getExpenses(500)])

    const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0)
    const totalProfit = sales.reduce((acc, s) => acc + (Number(s.profit) || 0), 0)
    const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0)
    const netIncome = totalProfit - totalExpenses

    return {
      totalRevenue,
      totalProfit,
      totalExpenses,
      netIncome,
      salesCount: sales.length
    }
  }
}
