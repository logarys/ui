import { env } from '$env/dynamic/public';

export const environment = {
  production: import.meta.env.PROD,
  apiUrl: env.PUBLIC_LOGARYS_API_URL ?? 'http://localhost:3000'
};
