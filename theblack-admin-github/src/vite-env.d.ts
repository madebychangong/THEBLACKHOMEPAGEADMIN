/// <reference types="vite/client" />

interface Window {
  ChannelIO?: (...args: unknown[]) => void;
  ChannelIOInitialized?: boolean;
  __THEBLACK_ADMIN_HOST__?: boolean;
}

interface ImportMetaEnv {
  readonly VITE_APP_MODE?: "public" | "admin";
}
