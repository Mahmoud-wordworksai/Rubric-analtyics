export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-v2.admin-wwai.com";
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dsfiuhdiufnf78y78hnuhf87eryiwe";
export const IS_NGROK_BACKEND = /ngrok(-free)?\.(app|dev)$/i.test(new URL(API_BASE_URL).hostname);
export const API_REQUEST_HEADERS = IS_NGROK_BACKEND
  ? { "ngrok-skip-browser-warning": "true" }
  : {};
