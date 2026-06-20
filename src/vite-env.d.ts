/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUDINARY_CLOUD: string
  readonly VITE_CLOUDINARY_PRESET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/// <reference types="vite-plugin-pwa/client" />
