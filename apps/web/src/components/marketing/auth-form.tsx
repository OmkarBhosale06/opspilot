"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (hydrated && user) router.replace("/overview");
  }, [hydrated, user, router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "signup") {
      if (!name.trim()) {
        setError("Name is required.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
    }
    setPending(true);
    const result =
      mode === "login" ? login(email, password) : signup(name, email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/overview");
  };

  const title = mode === "login" ? "Sign in to OpsPilot" : "Create your OpsPilot account";
  const cta = mode === "login" ? "Sign in" : "Create account";

  return (
    <MarketingChrome>
      <main id="main-content" className="mx-auto flex w-full max-w-md flex-col px-5 pb-20 pt-16">
        <p className="text-center text-[12px] uppercase tracking-[0.2em] text-white/40">
          {mode === "login" ? "Welcome back" : "Get started"}
        </p>
        <h1 className="mt-3 text-center font-serif text-4xl tracking-tight text-white">{title}</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-white/50">
          Accounts are stored in this browser only — a local demo session for the SRE console.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
        >
          {mode === "signup" ? (
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium text-white/45">Name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="h-10 bg-black/40"
                required
              />
            </label>
          ) : null}
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-white/45">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-10 bg-black/40"
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-white/45">Password</span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="h-10 bg-black/40"
              minLength={8}
              required
            />
          </label>
          {mode === "signup" ? (
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium text-white/45">Confirm password</span>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="h-10 bg-black/40"
                minLength={8}
                required
              />
            </label>
          ) : null}

          {error ? (
            <p role="alert" className="text-xs text-status-critical">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="h-10 w-full rounded-full" disabled={pending}>
            {cta}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-white/45">
          {mode === "login" ? (
            <>
              No account yet?{" "}
              <Link href="/signup" className="text-white hover:underline">
                Create one
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-white hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </main>
    </MarketingChrome>
  );
}
