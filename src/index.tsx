import "bootstrap/dist/css/bootstrap.min.css";
import "react-s-alert/dist/s-alert-default.css";
import "react-s-alert/dist/s-alert-css-effects/slide.css";
import "./index.css";

import React from "react";
import { App } from "./App";
import registerServiceWorker from "./registerServiceWorker";

import { createRoot } from "react-dom/client";
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);

registerServiceWorker();
