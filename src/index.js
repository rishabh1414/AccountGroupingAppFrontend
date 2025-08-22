import React from "react";
import ReactDOM from "react-dom/client";

// --- PrimeReact and PrimeFlex Imports ---
// 1. Core PrimeReact styles
import "primereact/resources/primereact.min.css";
// 2. A modern, clean theme
import "primereact/resources/themes/lara-light-indigo/theme.css";
// 3. PrimeIcons for the icon set
import "primeicons/primeicons.css";
// 4. PrimeFlex for the responsive grid and layout utilities
import "primeflex/primeflex.css";

// --- Global and App Imports ---
import "./index.css";
import App from "./App";
import { HelmetProvider } from "react-helmet-async";
const helmetContext = {};
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider context={helmetContext}>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
