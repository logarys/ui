import { browser } from '$app/environment';

declare global {
  interface Window {
    __RUNTIME_ENV__?: Record<string, string>;
  }
}

function getRuntimeEnv(name: string): string | undefined {
  if (!browser) {
    return undefined;
  }

  return window.__RUNTIME_ENV__?.[name];
}

export const environment = {
  production: import.meta.env.PROD,
  apiUrl:
    getRuntimeEnv('PUBLIC_CONSOLE_API_URL') ??
    'http://localhost:3002'
};