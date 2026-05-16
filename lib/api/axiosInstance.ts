import axios from "axios";
import Cookies from "js-cookie";

// Ensure no double slashes by trimming trailing slash from base URL
const baseURL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token from cookie to every request
axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;