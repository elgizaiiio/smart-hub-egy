import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent right-click context menu (allow on inputs/textareas)
document.addEventListener("contextmenu", (e) => {
  const target = e.target as HTMLElement;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || target.isContentEditable || target.closest(".selectable")) return;
  e.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
