/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_ENDPOINT?: string;
  readonly VITE_FF_COLLABORATION?: string;
  readonly VITE_FF_AI_FORCE_MAPPER?: string;
  readonly VITE_FF_WEBHOOKS?: string;
  readonly VITE_FF_NETWORK_INTELLIGENCE?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_ANALYTICS_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.module.css";
declare module "*.module.scss";
declare module "*.module.sass";

declare const __BUILD_TIMESTAMP__: string;
