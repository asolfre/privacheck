"use client";

import { Progress } from "@/components/ui/progress";
import type { RateLimitInfo } from "@/types";
import { Gauge } from "lucide-react";

interface ScanProgressProps {
  currentRepo: string;
  currentIndex: number;
  totalRepos: number;
  rateLimit?: RateLimitInfo | null;
}

export function ScanProgress({
  currentRepo,
  currentIndex,
  totalRepos,
  rateLimit,
}: ScanProgressProps) {
  // Show completed repos as percentage (currentIndex is 1-based for the
  // repo currently being scanned, so subtract 1 for repos fully done)
  const completedPct =
    totalRepos > 0 ? Math.round(((currentIndex - 1) / totalRepos) * 100) : 0;

  // Rate limit display helpers
  const ratePct =
    rateLimit && rateLimit.limit > 0
      ? (rateLimit.remaining / rateLimit.limit) * 100
      : null;

  // Percentage-based thresholds: >=20% = normal, <20% = warning, <5% = danger
  const rateColor =
    ratePct === null
      ? "text-muted-foreground"
      : ratePct < 5
        ? "text-red-500"
        : ratePct < 20
          ? "text-amber-500"
          : "text-muted-foreground";

  const rateBg =
    ratePct === null
      ? ""
      : ratePct < 5
        ? "bg-red-500/10 border-red-500/30"
        : ratePct < 20
          ? "bg-amber-500/10 border-amber-500/30"
          : "";

  // Time until rate limit resets
  function formatResetTime(): string | null {
    if (!rateLimit || !rateLimit.reset) return null;
    const now = Math.floor(Date.now() / 1000);
    const diff = rateLimit.reset - now;
    if (diff <= 0) return null;
    const mins = Math.ceil(diff / 60);
    return mins === 1 ? "resets in 1 min" : `resets in ${mins} min`;
  }

  const resetText = formatResetTime();

  return (
    <div className="w-full space-y-3">
      <Progress value={completedPct} className="animate-pulse" />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Scanning{" "}
          <span className="font-medium text-foreground">{currentRepo}</span>
          ...
        </p>
        <p className="tabular-nums">
          {currentIndex}/{totalRepos}
        </p>
      </div>

      {/* Rate limit display */}
      {rateLimit && rateLimit.limit > 0 && (
        <div
          className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${rateBg || "border-border"}`}
        >
          <div className={`flex items-center gap-1.5 ${rateColor}`}>
            <Gauge className="size-3.5" />
            <span className="font-medium">
              API Quota: {rateLimit.remaining.toLocaleString()}/{rateLimit.limit.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {resetText && (
              <span className="text-muted-foreground">{resetText}</span>
            )}
            {ratePct !== null && ratePct < 20 && (
              <span className={`font-medium ${rateColor}`}>
                {ratePct < 5 ? "Critical!" : "Running low"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
