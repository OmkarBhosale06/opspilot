"use client";

import Link from "next/link";
import { useState } from "react";
import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { ProductPreview } from "@/components/marketing/product-preview";
import { useAuthStore } from "@/stores/auth-store";

const HOW_IT_WORKS = [
  {
    index: "/01",
    kicker: "5xx spike · checkout-api",
    title: "Proactively monitors your environment",
    copy: "Ingests alerts, exceptions, and Kubernetes events from across the cluster, with noise filtered before it hits on-call.",
  },
  {
    index: "/02",
    kicker: "New failure pattern observed",
    title: "Maintains a rich context graph",
    copy: "Explores pods, deployments, and events, then learns recurring failure shapes so the next incident already has a causal path.",
  },
  {
    index: "/03",
    kicker: "Ledger update failed · us-east-1",
    title: "Escalates what actually matters",
    copy: "Groups related issues, summarizes blast radius, and keeps rollback behind an explicit approval path.",
  },
];

const STACK = [
  {
    title: "CLI & MCP",
    copy: "Give coding agents live cluster context to inspect, summarize, and propose fixes without leaving the terminal.",
  },
  {
    title: "Browser",
    copy: "See production at a glance — graph, evidence, and investigation stream on one command surface.",
  },
  {
    title: "On-call workflow",
    copy: "Approve remediations with policy context instead of jumping between dashboards, tickets, and kubectl.",
  },
];

const SECURITY = [
  {
    index: "/01",
    title: "Deploy anywhere",
    copy: "Run against your cluster from this console. Inventory stays in your environment.",
  },
  {
    index: "/02",
    title: "Evidence with citations",
    copy: "Every proposed action carries the graph, events, and policy that justified it.",
  },
  {
    index: "/03",
    title: "Human in the loop",
    copy: "Rollback and remediation stay gated. OpsPilot proposes; you approve.",
  },
  {
    index: "/04",
    title: "Local-first demo",
    copy: "Accounts on this build live in the browser — a contained SRE session, not a SaaS tenancy.",
  },
];

const FAQS = [
  {
    q: "Does OpsPilot replace observability tools?",
    a: "No. It sits on top of live Kubernetes signal — pods, deployments, and events — so you can investigate and approve without replacing Datadog, Prometheus, or your pager.",
  },
  {
    q: "What does it watch?",
    a: "Cluster inventory and event streams: graph topology, pod health, deployment history, and Kubernetes events, with an investigation trail for incidents.",
  },
  {
    q: "Can I just debug with a coding agent?",
    a: "Agents are useful for ad-hoc debugging. OpsPilot is the control plane around them: live cluster truth, blast radius, and a policy-aware approval path.",
  },
  {
    q: "There's a lot of noise in our cluster. Are we a fit?",
    a: "Yes. The product is most useful when the graph is noisy. Related signals are grouped so you spend time on incidents that actually need a decision.",
  },
];

export default function HeroPage() {
  const user = useAuthStore((s) => s.user);
  const primaryHref = user ? "/overview" : "/signup";

  return (
    <MarketingChrome>
      <main id="main-content" className="pb-24">
        <section className="mx-auto w-full max-w-4xl px-5 pt-16 text-center md:pt-24">
          <p className="text-[12px] uppercase tracking-[0.22em] text-white/45">
            AI-native Kubernetes incident response
          </p>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] tracking-tight text-white md:text-7xl">
            Production on autopilot
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-white/55 md:text-lg">
            Proactive incident response for live clusters — the graph, the evidence, and the rollback path in one surface.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              {user ? "Open the console" : "Get started"}
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full px-5 py-2.5 text-sm text-white/70 transition-colors hover:text-white"
            >
              How it works
            </Link>
          </div>
        </section>

        <div className="px-5">
          <ProductPreview />
        </div>

        <p className="mx-auto mt-12 max-w-3xl px-5 text-center text-[13px] text-white/40">
          For teams running production Kubernetes in{" "}
          <span className="text-white/70">finance</span>
          <span className="mx-2 text-white/20">·</span>
          <span className="text-white/70">healthcare</span>
          <span className="mx-2 text-white/20">·</span>
          <span className="text-white/70">insurance</span>
        </p>

        <section id="how-it-works" className="mx-auto mt-28 w-full max-w-6xl scroll-mt-24 px-5">
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">How it works</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight text-white md:text-5xl">
            How OpsPilot extracts signal from messy production systems
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/50">
            Infrastructure that lets on-call reason over a live cluster instead of assembling the story by hand.
          </p>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <article key={item.index}>
                <p className="font-mono text-[12px] text-white/35">{item.index}</p>
                <p className="mt-4 inline-flex rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/50">
                  {item.kicker}
                </p>
                <h3 className="mt-4 text-lg font-medium tracking-tight text-white">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/50">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="stack" className="mx-auto mt-28 w-full max-w-6xl scroll-mt-24 px-5">
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">Your stack</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight text-white md:text-5xl">
            How OpsPilot fits into your workflow
          </h2>
          <p className="mt-4 max-w-xl text-[15px] text-white/50">
            Everyone works differently. Designed to adapt to your setup.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STACK.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <h3 className="text-base font-medium text-white">{item.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-white/50">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="security" className="mx-auto mt-28 w-full max-w-6xl scroll-mt-24 px-5">
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">Secure by design</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight text-white md:text-5xl">
            Designed for the most sensitive environments
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITY.map((item) => (
              <article key={item.index}>
                <p className="font-mono text-[12px] text-white/35">{item.index}</p>
                <h3 className="mt-3 text-base font-medium text-white">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/50">{item.copy}</p>
              </article>
            ))}
          </div>
          <p className="mt-14 max-w-3xl font-serif text-2xl leading-snug text-white/80 md:text-3xl">
            We&apos;re building a control plane so agents can root-cause incidents with the same cluster context your on-call already trusts — and only surface issues that actually need a human.
          </p>
        </section>

        <section id="faq" className="mx-auto mt-28 w-full max-w-3xl scroll-mt-24 px-5">
          <h2 className="font-serif text-3xl text-white md:text-5xl">FAQ</h2>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {FAQS.map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </section>

        <section className="mx-auto mt-28 w-full max-w-4xl px-5 text-center">
          <h2 className="font-serif text-4xl leading-tight text-white md:text-5xl">
            Experience OpsPilot in your cluster.
          </h2>
          <div className="mt-8">
            <Link
              href={primaryHref}
              className="inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              {user ? "Continue to Overview" : "Create a local account"}
            </Link>
          </div>
        </section>
      </main>
    </MarketingChrome>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] text-white">{question}</span>
        <span className="text-white/40">{open ? "–" : "+"}</span>
      </button>
      {open ? (
        <p className="pb-5 text-[14px] leading-relaxed text-white/50">{answer}</p>
      ) : null}
    </div>
  );
}
