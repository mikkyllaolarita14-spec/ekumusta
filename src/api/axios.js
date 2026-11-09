import axios from "axios";

// API base URL.
// - Dev: local Laravel server unless VITE_API_BASE_URL is set.
// - Prod: the deployed (ngrok) backend unless VITE_API_BASE_URL is set
//   (e.g. a GitHub Actions repository variable).
const DEV_API_URL = "http://127.0.0.1:8000/api";
const PROD_API_URL = "https://unlovely-badge-kiln.ngrok-free.dev/api";

function normalizeBaseUrl(url) {
  if (!url) return url;
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const api = axios.create({
  baseURL: normalizeBaseUrl(
    import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.DEV ? DEV_API_URL : PROD_API_URL)
  ),
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    // Skips ngrok's free-tier browser warning page for API requests.
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ekumusta_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;