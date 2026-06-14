"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Uploads a profile photo to the public "avatars" bucket under {uid}/ and
// stores its URL on the profile. The figurita then renders it.
export function AvatarUpload({ hasPhoto }: { hasPhoto: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen es muy pesada (máx. 5 MB).");
      return;
    }
    setError(null);
    setUploading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Tu sesión expiró, volvé a entrar.");
      setUploading(false);
      return;
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`; // cache-bust so the new photo shows

    const { error: updErr } = await supabase.from("profiles").update({ foto_url: url }).eq("id", user.id);
    if (updErr) {
      setError(updErr.message);
      setUploading(false);
      return;
    }

    setUploading(false);
    router.refresh();
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full rounded-2xl border border-line px-5 py-4 text-center font-condensed text-base font-bold uppercase tracking-[0.12em] text-ink-soft transition-[transform,border-color] duration-150 ease-out hover:border-ink-muted active:scale-[0.98] disabled:opacity-50"
      >
        {uploading ? "Subiendo…" : hasPhoto ? "📸 Cambiar foto" : "📸 Subir foto de perfil"}
      </button>
      {error && <p className="text-center text-[13px] text-red">{error}</p>}
    </>
  );
}
