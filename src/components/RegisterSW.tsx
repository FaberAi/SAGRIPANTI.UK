"use client";
import { useEffect } from "react";

// Registra il service worker: rende il sito installabile come PWA.
export default function RegisterSW() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registrazione fallita: il sito resta comunque pienamente funzionante */
    });
  }, []);
  return null;
}
