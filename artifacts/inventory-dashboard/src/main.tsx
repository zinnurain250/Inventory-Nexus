import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// সরাসরি আপনার ব্যাকএন্ড লিংকটি এখানে বসিয়ে দিন
setBaseUrl("https://inventory-nexus-api-server-75vc.vercel.app");

createRoot(document.getElementById("root")!).render(<App />);
