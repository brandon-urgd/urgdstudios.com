/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_CLIENT_ID: string;
  readonly VITE_COGNITO_REGION: string;
  readonly VITE_COMMAND_CENTER: string;
  readonly VITE_COMMAND_CENTER_REPLY: string;
  readonly VITE_COMMAND_CENTER_AUTO_RESPONSE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
