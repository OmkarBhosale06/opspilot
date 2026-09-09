"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import ClickSpark from "@/components/react-bits/ClickSpark";
import DarkVeil from "@/components/react-bits/DarkVeil";
import SplashCursor from "@/components/react-bits/SplashCursor";
import TargetCursor from "@/components/react-bits/TargetCursor";
import { useEffect, useState } from "react";

export function MarketingChrome({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [cursorReady, setCursorReady] = useState(false);

  useEffect(() => {
    hydrate();
    setCursorReady(true);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [hydrate]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {!reduceMotion ? (
        <>
          <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
            <DarkVeil
              hueShift={268}
              noiseIntensity={0.12}
              scanlineIntensity={0.08}
              scanlineFrequency={0.8}
              warpAmount={0.45}
              speed={0.55}
            />
          </div>
          {cursorReady ? (
            <>
              <SplashCursor
                TRANSPARENT
                COLOR="#8b7cf6"
                SPLAT_RADIUS={0.18}
                SPLAT_FORCE={4200}
                DENSITY_DISSIPATION={2.8}
              />
              <TargetCursor
                targetSelector=".cursor-target"
                hideDefaultCursor
                cursorColor="#c4b5fd"
                cursorColorOnTarget="#38bdf8"
                spinDuration={3}
              />
            </>
          ) : null}
        </>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-background/50 to-background" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="cursor-target flex items-center gap-2.5">
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
            <Button asChild size="sm" className="cursor-target">
              <Link href="/overview">Open console</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="cursor-target">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="cursor-target">
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
