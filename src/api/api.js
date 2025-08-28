// src/api/api.js
import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "https://accountgroupingappbackend-335063528102.us-east4.run.app/api",
});
console.log("My API URL is:", process.env.REACT_APP_API_URL);
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
