import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import { App } from "./App";
import { createRoot } from "react-dom/client";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<App />);
