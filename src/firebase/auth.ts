import { getAuth } from 'firebase/auth'
import { app } from './firebase'

export const auth = getAuth(app)

/**
 * Note: Authentication is currently disabled for single-shop/owner workflow.
 * Future employee roles and login methods can be cleanly added here.
 */
export async function getCurrentUser() {
  return auth.currentUser
}
