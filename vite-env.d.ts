/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Basis-URL der mailarc-server client-API, z. B. http://localhost:9000 */
  readonly VITE_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
