export const BLOG_API_BASE_URL = String(
  import.meta.env.VITE_BLOG_API_URL ||
    "https://woven-affecting-accuracy.ngrok-free.dev",
).replace(/\/$/, "");

export const getBlogApiOptions = (options = {}) => ({
  ...options,
  // Saat development, Vite meneruskan /__blog_api ke BLOG_API_BASE_URL.
  // Ini tetap menuju ngrok sekaligus menghindari masalah CORS di browser.
  baseURL: import.meta.env.DEV ? "/__blog_api" : BLOG_API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    ...options.headers,
  },
});
