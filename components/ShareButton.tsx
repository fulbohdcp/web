"use client";

import { useState } from "react";

// Shares the public figurita link via the native share sheet (WhatsApp,
// Instagram, etc. on mobile), falling back to copying the link on desktop.
export function ShareButton({ username, nombre }: { username: string; nombre: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/j/${username}`;
    const data = {
      title: `${nombre} · HDCP`,
      text: `Mirá mi figurita en HDCP, el handicap del fútbol 👇`,
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // user cancelled or share failed → fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  }

  return (
    <button
      onClick={share}
      className="w-full rounded-2xl px-5 py-4 text-center font-condensed text-lg font-extrabold uppercase tracking-[0.12em] text-ink shadow-[0_12px_40px_oklch(0.52_0.13_152_/_0.5)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98]"
      style={{ background: "linear-gradient(135deg, oklch(0.56 0.14 152), oklch(0.38 0.10 152))" }}
    >
      {copied ? "¡Link copiado! 📋" : "🚀 Compartir mi figurita"}
    </button>
  );
}
