import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
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

export type SignInMethod = 'password' | 'google'

export function getSignInMethod(): SignInMethod {
  const providers = auth.currentUser?.providerData.map((p) => p.providerId) ?? []
  return providers.includes('password') ? 'password' : 'google'
}

export async function reauthenticate(password?: string) {
  const user = auth.currentUser
  if (!user) throw new Error('Sessão expirada. Faça login novamente.')

  if (getSignInMethod() === 'password') {
    const credential = EmailAuthProvider.credential(user.email ?? '', password ?? '')
    await reauthenticateWithCredential(user, credential)
  } else {
    await reauthenticateWithPopup(user, new GoogleAuthProvider())
  }
  // força um token novo, com auth_time recente
  await user.getIdToken(true)
}