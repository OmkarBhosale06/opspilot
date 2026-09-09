"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type Point = { t: string; value: number };

export function ErrorRateSparkline({
  data,
  className,
  critical = false,
}: {
  data: Point[];
  className?: string;
  critical?: boolean;
}) {
  const stroke = critical ? "var(--status-critical)" : "var(--status-info)";
  const fill = critical
    ? "color-mix(in oklab, var(--status-critical) 25%, transparent)"
    : "color-mix(in oklab, var(--status-info) 20%, transparent)";

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-16 items-center justify-center text-[11px] text-muted-foreground",
          className
        )}
      >
        No metric series
      </div>
    );
  }

  return (
    <div className={cn("h-16 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 11,
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            formatter={(value) => [
              `${Number(value).toFixed(1)}%`,
              "Error rate",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            fill={fill}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Demo series used when Prometheus isn't wired yet */
export function demoErrorRateSeries(current = 18.4): Point[] {
  const base = Math.max(0.2, current * 0.02);
  return Array.from({ length: 24 }).map((_, i) => ({
    t: `${i}`,
    value: i < 16 ? base + Math.random() * 0.4 : current * (0.7 + Math.random() * 0.35),
  }));
}
