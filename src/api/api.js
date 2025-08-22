// src/api/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000/api",
});

// attach token + timezone on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const tz =
    Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || "Asia/Kolkata";
  config.headers["x-timezone"] = tz === "Asia/Calcutta" ? "Asia/Kolkata" : tz;
  return config;
});

export default api;
