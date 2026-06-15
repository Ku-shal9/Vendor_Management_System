import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import {
  ThemeProvider,
  initThemeBeforeRender,
} from "./context/ThemeContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import { ConfirmProvider } from "./context/ConfirmContext.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";
import "./index.css";

initThemeBeforeRender();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
