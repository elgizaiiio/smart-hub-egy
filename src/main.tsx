import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent right-click context menu
document.addEventListener("contextmenu", (e) => e.preventDefault());

createRoot(document.getElementById("root")!).render(<App />);
