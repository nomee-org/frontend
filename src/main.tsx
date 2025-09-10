import { Buffer } from "buffer";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

window.Buffer = window.Buffer ?? Buffer;
globalThis.Buffer = window.Buffer ?? Buffer;
window.global = window.global ?? window;

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
