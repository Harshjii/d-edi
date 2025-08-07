/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUDINARY_CLOUD_NAME: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string
  readonly VITE_CLOUDINARY_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  _env_?: {
    CLOUDINARY_CLOUD_NAME?: string
    CLOUDINARY_UPLOAD_PRESET?: string
    CLOUDINARY_API_KEY?: string
  }
}

declare module '*.mp4' {
  const src: string;
  export default src;
}