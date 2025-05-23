import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App.tsx";
import "./index.css";
import { initializeStores } from "./store";

// Initialize all stores before rendering the app
initializeStores().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
      <Toaster position="bottom-right" />
    </React.StrictMode>,
  );
});
