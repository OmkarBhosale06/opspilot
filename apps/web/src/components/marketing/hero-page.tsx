"use client";

import Link from "next/link";
import { Activity, GitBranch, Radio, Shield } from "lucide-react";
import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { useAuthStore } from "@/stores/auth-store";
import BlurText from "@/components/react-bits/BlurText";
import GradientText from "@/components/react-bits/GradientText";
import ShinyText from "@/components/react-bits/ShinyText";
import SpotlightCard from "@/components/react-bits/SpotlightCard";
import Magnet from "@/components/react-bits/Magnet";
import StarBorder from "@/components/react-bits/StarBorder";
import CountUp from "@/components/react-bits/CountUp";
import GlareHover from "@/components/react-bits/GlareHover";

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
      <main id="main-content" className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-20 pt-10 md:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <ShinyText
            text="Kubernetes incident response, without the war-room scramble"
            className="text-xs uppercase tracking-[0.18em]"
            color="#9b9ba8"
            shineColor="#ffffff"
            speed={3}
          />
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            <BlurText
              text="See the blast radius. Approve the fix."
              animateBy="words"
              delay={80}
              className="justify-center text-4xl font-semibold tracking-tight md:text-6xl"
            />
          </h1>
          <div className="mt-4 flex justify-center">
            <GradientText
              colors={["#8b7cf6", "#38bdf8", "#a78bfa", "#8b7cf6"]}
              animationSpeed={6}
              className="text-lg font-medium md:text-xl"
            >
              OpsPilot watches the cluster, investigates incidents, and keeps rollback in policy.
            </GradientText>
          </div>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Built for SREs who need live Kubernetes truth next to AI investigation — not another dashboard that waits for a ticket.
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
              >
                {user ? "Open the console" : "Get started"}
              </StarBorder>
            </Magnet>
            {!user ? (
              <Link
                href="/login"
                className="rounded-full border border-border bg-card/70 px-5 py-3 text-sm text-foreground hover:bg-accent"
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>

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
              className="bg-card/80 p-6"
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
              className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
            >
              {user ? "Continue to Overview" : "Create a free local account"}
            </Link>
          </div>
        </GlareHover>
      </main>
    </MarketingChrome>
  );
}
