"use client";

import { useEffect } from "react";

export function useClipboardGuard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const prevent = (event: ClipboardEvent) => event.preventDefault();
    document.addEventListener("copy", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("cut", prevent);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("cut", prevent);
    };
  }, [enabled]);
}
