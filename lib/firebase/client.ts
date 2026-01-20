import { FirebaseApp, getApps, initializeApp } from 'firebase/app'
import { Firestore, getFirestore } from 'firebase/firestore'
import { Auth, getAuth, signInWithCustomToken } from 'firebase/auth'

/**
 * Initialisation Firebase côté client (Next.js "use client").
 *
 * Important:
 * - Utilise des variables NEXT_PUBLIC_*.
 * - Les valeurs par défaut sont dérivées de la config Android existante (google-services.json),
 *   mais il est fortement recommandé de renseigner les variables d’env en prod.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDPAKyaXFXOQUDrCADfMAOS3yPSRDvuHGI',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'geoloc-cotonou.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'geoloc-cotonou',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'geoloc-cotonou.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '191342105680',
  // NOTE: L'appId Web est souvent différent de l'appId Android. À fournir via env dès que possible.
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:191342105680:android:842ebafae0e595eb19ed55',
}

let _app: FirebaseApp | null = null
let _db: Firestore | null = null
let _auth: Auth | null = null

export function getFirebaseApp() {
  if (_app) return _app
  _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  return _app
}

export function getAuthInstance() {
  if (_auth) return _auth
  _auth = getAuth(getFirebaseApp())
  return _auth
}

export function getDb() {
  if (_db) return _db
  _db = getFirestore(getFirebaseApp())
  return _db
}

/**
 * Authentifie l'utilisateur avec Firebase Auth en utilisant un token personnalisé
 * @param customToken Token Firebase personnalisé obtenu du backend
 */
export async function authenticateWithFirebase(customToken: string) {
  const auth = getAuthInstance()
  try {
    const userCredential = await signInWithCustomToken(auth, customToken)
    return userCredential.user
  } catch (error) {
    console.error('Erreur authentification Firebase:', error)
    throw error
  }
}



