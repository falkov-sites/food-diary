import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth'
import { auth } from '../firebase'

export const observeAuthState = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback)

export const loginWithEmail = async (email: string, password: string) => {
  await setPersistence(auth, browserLocalPersistence)
  return signInWithEmailAndPassword(auth, email, password)
}

export const registerWithEmail = async (email: string, password: string) => {
  await setPersistence(auth, browserLocalPersistence)
  return createUserWithEmailAndPassword(auth, email, password)
}

export const logoutCurrentUser = async () => {
  await signOut(auth)
}
