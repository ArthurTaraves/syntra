// ÚNICO ponto do projeto que inicializa o Firebase. Nenhuma credencial fica no código:
// tudo vem das variáveis VITE_FIREBASE_* do arquivo .env.
import { deleteApp, getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import { browserSessionPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth'
import { initializeFirestore, type Firestore } from 'firebase/firestore'

const env = import.meta.env

export const configFirebase: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigurado = Boolean(configFirebase.apiKey && configFirebase.projectId)

let instancias: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null

export function obterFirebase() {
  if (!instancias) {
    const app = getApps().length ? getApp() : initializeApp(configFirebase)
    const auth = getAuth(app)
    // Sessão some ao fechar o navegador — adequado para o totem em modo quiosque.
    void setPersistence(auth, browserSessionPersistence)
    const db = initializeFirestore(app, { ignoreUndefinedProperties: true })
    instancias = { app, auth, db }
  }
  return instancias
}

/** App secundário temporário: cria contas sem derrubar a sessão do administrador. */
export async function comAppSecundario<T>(fn: (auth: Auth) => Promise<T>): Promise<T> {
  const sec = initializeApp(configFirebase, `cadastro-${Date.now()}`)
  try {
    return await fn(getAuth(sec))
  } finally {
    await deleteApp(sec)
  }
}

/** O Firebase Auth usa e-mail; a matrícula vira um e-mail interno fictício que o usuário nunca vê. */
export const emailDaMatricula = (matricula: string) => `${matricula}@syntra.local`
