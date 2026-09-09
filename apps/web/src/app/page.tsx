import type { Metadata } from "next";
import HeroPage from "@/components/marketing/hero-page";

export const metadata: Metadata = {
  title: "OpsPilot",
  description: "AI-native SRE control plane for Kubernetes incident response",
};

export default function Home() {
  return <HeroPage />;
}
