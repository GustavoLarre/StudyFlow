import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from './firebase'

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password)

export const register = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email.trim(), password)

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim())

export const loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider())

export const logout = () => signOut(auth)

export const getIdToken = async () => (await auth.currentUser?.getIdToken()) ?? null