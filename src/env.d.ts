declare const DELCOM_BASEURL: string;

interface ImportMetaEnv {
  readonly VITE_DELCOM_BASEURL: string;
  readonly APP_PORT: string;
  readonly PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
