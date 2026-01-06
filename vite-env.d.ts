/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SQUARE_SANDBOX_APP_ID: string
  readonly VITE_SQUARE_SANDBOX_LOCATION_ID: string
  readonly VITE_SQUARE_PROD_APP_ID: string
  readonly VITE_SQUARE_PROD_LOCATION_ID: string
  readonly VITE_SQUARE_ENVIRONMENT: 'sandbox' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
