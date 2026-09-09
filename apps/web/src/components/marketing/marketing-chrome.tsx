"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import DarkVeil from "@/components/react-bits/DarkVeil";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#stack", label: "Your stack" },
  { href: "/#security", label: "Security" },
  { href: "/#faq", label: "FAQ" },
];

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
    <div className="relative min-h-screen overflow-x-hidden bg-[#050506] text-foreground">
      {!reduceMotion ? (
        <div className="pointer-events-none fixed inset-0 opacity-40" aria-hidden>
          <DarkVeil
            hueShift={220}
            noiseIntensity={0.06}
            scanlineIntensity={0.02}
            scanlineFrequency={0.4}
            warpAmount={0.18}
            speed={0.28}
          />
        </div>
      ) : null}
      <div className="marketing-grain" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_42%),linear-gradient(to_bottom,rgba(5,5,6,0.2),#050506_72%)]"
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-[11px] font-medium tracking-tight">
            Op
          </span>
          <span className="text-sm font-medium tracking-tight">OpsPilot</span>
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] text-white/55 md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {hydrated && user ? (
            <Link
              href="/overview"
              className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-black transition-opacity hover:opacity-90"
            >
              Open console
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-3 py-1.5 text-[13px] text-white/70 transition-colors hover:text-white sm:inline"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-black transition-opacity hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-10 pt-6">
        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>OpsPilot · SRE control plane</p>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-white">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-white">
              Create account
            </Link>
            <Link href="/#security" className="hover:text-white">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
