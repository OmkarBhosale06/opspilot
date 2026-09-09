"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import ClickSpark from "@/components/react-bits/ClickSpark";
import Aurora from "@/components/react-bits/Aurora";
import { useEffect, useState } from "react";

export function MarketingChrome({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    hydrate();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [hydrate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {!reduceMotion ? (
        <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden>
          <Aurora
            colorStops={["#8b7cf6", "#38bdf8", "#6d62d4"]}
            amplitude={1.05}
            blend={0.55}
            speed={0.7}
          />
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-background/55 to-background" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai/20 text-ai">
            <Shield className="h-4 w-4" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">OpsPilot</span>
            <span className="block text-[11px] text-muted-foreground">
              AI SRE control plane
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {hydrated && user ? (
            <Button asChild size="sm">
              <Link href="/overview">Open console</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Create account</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <ClickSpark sparkColor="#8b7cf6" sparkCount={10} sparkRadius={22} duration={480}>
        <div className="relative z-10">{children}</div>
      </ClickSpark>
    </div>
  );
}
