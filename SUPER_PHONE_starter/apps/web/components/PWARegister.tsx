"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        registration.update().catch((error) => {
          console.error("SUPER PHONE service worker update failed:", error);
        });
      })
      .catch((error) => {
        console.error("SUPER PHONE service worker registration failed:", error);
      });
  }, []);
  return null;
}