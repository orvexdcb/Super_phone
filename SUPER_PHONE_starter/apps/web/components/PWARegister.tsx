"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let registration: ServiceWorkerRegistration | undefined;
    navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .then((value) => { registration = value; })
      .catch((error) => {
        console.error("SUPER PHONE service worker registration failed:", error);
      });
    return () => {
      // Keep the registration active when the React tree changes.
      void registration;
    };
  }, []);

  return null;
}
