"use client";

import Link from "next/link";
import { Activity, GitBranch, Radio, Shield } from "lucide-react";
import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { useAuthStore } from "@/stores/auth-store";
import BlurText from "@/components/react-bits/BlurText";
import GradientText from "@/components/react-bits/GradientText";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import Magnet from "@/components/react-bits/Magnet";
import StarBorder from "@/components/react-bits/StarBorder";
import CountUp from "@/components/react-bits/CountUp";
import GlareHover from "@/components/react-bits/GlareHover";
import ScrollExpand from "@/components/react-bits/ScrollExpand";
import DecryptedText from "@/components/react-bits/DecryptedText";
import TextType from "@/components/react-bits/TextType";

const FEATURES = [
  {
    icon: Radio,
    title: "Live cluster signal",
    copy: "Pods, deployments, and Kubernetes events stream into one command surface.",
  },
  {
    icon: Shield,
    title: "Incident command",
    copy: "Evidence, causal chain, and rollback approval stay together instead of jumping tools.",
  },
  {
    icon: GitBranch,
    title: "Safe remediation",
    copy: "Proposed actions carry policy context so on-call can approve without guessing.",
  },
];

export default function HeroPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <MarketingChrome>
      <main id="main-content" className="pb-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-5 pt-10 md:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <DecryptedText
              text="Kubernetes incident response, without the war-room scramble"
              animateOn="view"
              sequential
              revealDirection="start"
              speed={28}
              className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
              encryptedClassName="text-xs uppercase tracking-[0.18em] text-ai/50"
              parentClassName="justify-center"
            />
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
              <BlurText
                text="See the blast radius. Approve the fix."
                animateBy="words"
                delay={80}
                className="justify-center text-4xl font-semibold tracking-tight md:text-6xl"
              />
            </h1>
            <div className="mt-5 min-h-[2rem] text-lg font-medium md:text-xl">
              <TextType
                text={[
                  "Watch the cluster.",
                  "Investigate the incident.",
                  "Keep rollback in policy.",
                ]}
                typingSpeed={42}
                deletingSpeed={24}
                pauseDuration={1600}
                className="text-ai"
                cursorClassName="text-ai"
              />
            </div>
            <div className="mt-4 flex justify-center">
              <GradientText
                colors={["#8b7cf6", "#38bdf8", "#a78bfa", "#8b7cf6"]}
                animationSpeed={6}
                className="text-sm font-medium md:text-base"
              >
                OpsPilot is the SRE control plane for live Kubernetes truth.
              </GradientText>
            </div>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Built for on-call who need the graph, the evidence, and the approval path in the same place.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Magnet padding={40} magnetStrength={3}>
                <StarBorder
                  as={Link}
                  href={user ? "/overview" : "/signup"}
                  color="#8b7cf6"
                  speed="5s"
                  thickness={2}
                  backgroundColor="#0c0c10"
                  textColor="#fafafa"
                  borderColor="#24242c"
                  className="cursor-target"
                >
                  {user ? "Open the console" : "Get started"}
                </StarBorder>
              </Magnet>
              {!user ? (
                <Link
                  href="/login"
                  className="cursor-target rounded-full border border-border bg-card/70 px-5 py-3 text-sm text-foreground hover:bg-accent"
                >
                  Sign in
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <section className="relative mt-16 w-full">
          <ScrollExpand
            src="/cluster-expand.svg"
            alt="Cluster topology expanding into a full command surface"
            title="Watch the blast radius unfold"
            scrollHint="Scroll to expand"
            useWindowScroll
            startWidth={42}
            startHeight={58}
            startRadius={28}
            endRadius={0}
            mediaZoom={1.28}
            scrollDistance={1.15}
            holdDistance={0.28}
            overlayScrim={0.5}
            className="h-auto"
          >
            <div className="max-w-lg space-y-4">
              <DecryptedText
                text="Full-bleed command surface"
                animateOn="view"
                sequential
                speed={32}
                className="text-2xl font-semibold text-white md:text-4xl"
                encryptedClassName="text-2xl font-semibold text-white/40 md:text-4xl"
              />
              <p className="text-sm text-white/75 md:text-base">
                The frame grows with your scroll — from a contained incident snapshot into the live cluster graph.
              </p>
              <Link
                href={user ? "/overview" : "/signup"}
                className="cursor-target inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black"
              >
                {user ? "Enter Overview" : "Start investigating"}
              </Link>
            </div>
          </ScrollExpand>
        </section>

        <div className="mx-auto flex w-full max-w-6xl flex-col px-5">
          <dl className="mx-auto mt-16 grid w-full max-w-3xl grid-cols-3 gap-4 border-y border-border-subtle py-8 text-center">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                MTTD
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                <CountUp to={42} duration={1.6} />
                <span className="text-sm text-muted-foreground">s</span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Live watches
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                <CountUp to={4} duration={1.4} />
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Approval path
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                <CountUp to={1} duration={1.2} />
              </dd>
            </div>
          </dl>

          <section className="mt-14 grid gap-4 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <SpotlightCard
                key={feature.title}
                className="cursor-target bg-card/80 p-6"
                spotlightColor="rgba(139, 124, 246, 0.22)"
              >
                <feature.icon className="h-4 w-4 text-ai" aria-hidden />
                <h2 className="mt-3 text-sm font-semibold">{feature.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {feature.copy}
                </p>
              </SpotlightCard>
            ))}
          </section>

          <GlareHover
            width="100%"
            height="auto"
            background="transparent"
            borderColor="#24242c"
            borderRadius="16px"
            glareColor="#8b7cf6"
            glareOpacity={0.18}
            className="mt-12 px-6 py-8"
          >
            <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-medium">
                  <Activity className="h-4 w-4 text-status-info" aria-hidden />
                  Ready when the cluster is.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sign in on this device, then drop into Overview with live SSE and Kubernetes inventory.
                </p>
              </div>
              <Link
                href={user ? "/overview" : "/signup"}
                className="cursor-target rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
              >
                {user ? "Continue to Overview" : "Create a free local account"}
              </Link>
            </div>
          </GlareHover>
        </div>
      </main>
    </MarketingChrome>
  );
}
