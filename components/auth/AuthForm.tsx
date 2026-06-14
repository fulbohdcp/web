"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Mode = "signup" | "login";

export function AuthForm({ mode }: { mode: Mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const notConfigured = !isSupabaseConfigured;

  async function handleGoogle() {
    if (notConfigured) return setError("Supabase todavía no está configurado (.env.local).");
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // on success the browser is redirected to Google
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (notConfigured) return setError("Supabase todavía no está configurado (.env.local).");
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // confirm-email ON → no session yet; confirm-email OFF → straight in
      if (data.session) {
        router.push("/perfil");
      } else {
        setCheckEmail(true);
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push("/perfil");
      router.refresh();
    }
  }

  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 py-12">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse 90% 50% at 50% 0%, oklch(0.30 0.06 152 / 0.4), transparent 60%)" }}
      />

      <Link href="/" className="font-display text-3xl tracking-[0.22em] text-ink">
        HDCP
      </Link>

      <div className="mt-8 w-full max-w-[400px] rounded-3xl border border-line bg-surface p-7">
        {checkEmail ? (
          <CheckEmail email={email} />
        ) : (
          <>
            <h1 className="font-condensed text-3xl font-extrabold uppercase leading-none text-ink">
              {isSignup ? "Creá tu cuenta" : "Bienvenido de vuelta"}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {isSignup ? "Guardá tu figurita y empezá a sumar partidos." : "Entrá para ver tu figurita y tus amigos."}
            </p>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-surface-2 px-5 py-3.5 font-condensed text-base font-bold uppercase tracking-[0.1em] text-ink transition hover:border-ink-muted disabled:opacity-50"
            >
              <GoogleMark />
              Continuar con Google
            </button>

            <div className="my-5 flex items-center gap-3 text-ink-faint">
              <span className="h-px flex-1 bg-line" />
              <span className="font-condensed text-[11px] uppercase tracking-[0.2em]">o con email</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={handleEmail} className="flex flex-col gap-3">
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="vos@email.com" autoComplete="email" />
              <Field
                label="Contraseña"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-2xl px-5 py-3.5 font-condensed text-lg font-extrabold uppercase tracking-[0.12em] text-ink transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                style={{ background: "linear-gradient(135deg, oklch(0.56 0.14 152), oklch(0.38 0.10 152))" }}
              >
                {loading ? "Un segundo…" : isSignup ? "Crear cuenta" : "Entrar"}
              </button>
            </form>

            {error && (
              <p className="mt-4 rounded-xl border border-[oklch(0.62_0.20_25_/_0.3)] bg-[oklch(0.62_0.20_25_/_0.1)] px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                {error}
              </p>
            )}

            <p className="mt-6 text-center text-sm text-ink-muted">
              {isSignup ? (
                <>
                  ¿Ya tenés cuenta?{" "}
                  <Link href="/login" className="font-bold text-green-light hover:underline">
                    Entrá
                  </Link>
                </>
              ) : (
                <>
                  ¿Todavía no?{" "}
                  <Link href="/onboarding" className="font-bold text-green-light hover:underline">
                    Armá tu figurita
                  </Link>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function CheckEmail({ email }: { email: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl">📬</div>
      <h1 className="mt-3 font-condensed text-2xl font-extrabold uppercase leading-tight text-ink">Revisá tu mail</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Te mandamos un link a <span className="text-ink">{email}</span> para confirmar tu cuenta. Cuando lo abras, tu
        figurita queda guardada.
      </p>
      <p className="mt-4 text-xs text-ink-muted">¿No te llegó? Mirá en spam o probá de nuevo en un minuto.</p>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-condensed text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-ink outline-none transition placeholder:text-ink-faint focus:border-green-light"
      />
    </label>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
