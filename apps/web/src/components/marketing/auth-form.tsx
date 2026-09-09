"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ElectricBorder from "@/components/react-bits/ElectricBorder";
import ShinyText from "@/components/react-bits/ShinyText";
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
      <main id="main-content" className="mx-auto flex w-full max-w-md flex-col px-5 pb-20 pt-6">
        <ShinyText
          text={mode === "login" ? "Welcome back" : "Join the control plane"}
          className="text-center text-xs uppercase tracking-[0.18em]"
          color="#9b9ba8"
          shineColor="#ffffff"
          speed={3}
        />
        <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
          Accounts are stored in this browser only — a local demo session for the SRE console.
        </p>

        <ElectricBorder
          color="#8b7cf6"
          speed={1.1}
          chaos={0.08}
          borderRadius={20}
          className="mt-8"
        >
          <form
            onSubmit={onSubmit}
            className="space-y-3 rounded-[20px] bg-card/90 p-6 backdrop-blur"
          >
            {mode === "signup" ? (
              <label className="block space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Name</span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="h-10 bg-background/70"
                  required
                />
              </label>
            ) : null}
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-10 bg-background/70"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Password</span>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="h-10 bg-background/70"
                minLength={8}
                required
              />
            </label>
            {mode === "signup" ? (
              <label className="block space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Confirm password
                </span>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="h-10 bg-background/70"
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

            <Button type="submit" className="cursor-target h-10 w-full" disabled={pending}>
              {cta}
            </Button>
          </form>
        </ElectricBorder>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {mode === "login" ? (
            <>
              No account yet?{" "}
              <Link href="/signup" className="text-ai hover:underline">
                Create one
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-ai hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </main>
    </MarketingChrome>
  );
}
