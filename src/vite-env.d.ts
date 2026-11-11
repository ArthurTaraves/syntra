/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  /**
   * "firebase", "local" ou "sharepoint" (esqueleto: mostra a tela "integração prevista").
   * Se vazio: firebase quando configurado, senão local (demonstração).
   */
  readonly VITE_DATA_PROVIDER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
