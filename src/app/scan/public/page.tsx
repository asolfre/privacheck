"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { ParsedGitHubInput, RateLimitInfo, ScanResult, RepoInfo } from "@/types";
import { PublicScanForm } from "@/components/public-scan-form";
import { ScanResults } from "@/components/scan-results";
import { ScanProgress } from "@/components/scan-progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ArrowRight, ChevronRight, Info, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FailedRepo {
  fullName: string;
  error: string;
}

export default function PublicScanPage() {
  const [scanning, setScanning] = useState(false);
  const [currentRepo, setCurrentRepo] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalRepos, setTotalRepos] = useState(0);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [failedRepos, setFailedRepos] = useState<FailedRepo[]>([]);
  const [failedReposOpen, setFailedReposOpen] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleScan = useCallback(
    async (parsed: ParsedGitHubInput, scanAll: boolean) => {
      const controller = new AbortController();
      abortRef.current = controller;

      setScanning(true);
      setScanComplete(false);
      setResults([]);
      setFailedRepos([]);
      setFailedReposOpen(false);
      setError(null);
      setRateLimit(null);

      try {
        if (parsed.type === "repo" && parsed.repo) {
          // Scan single repo
          setTotalRepos(1);
          setCurrentRepo(`${parsed.owner}/${parsed.repo}`);
          setCurrentIndex(1);

          const res = await fetch("/api/scan/commits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              owner: parsed.owner,
              repo: parsed.repo,
              scanAll,
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Failed to scan repository");
          }

          const result: ScanResult = await res.json();
          result.isPrivate = false;
          if (result.rateLimit) {
            setRateLimit(result.rateLimit);
          }
          setResults([result]);
        } else {
          // Scan all public repos for user -- fetch through backend
          const reposRes = await fetch(
            `/api/scan/repos?username=${encodeURIComponent(parsed.owner)}`,
            { signal: controller.signal },
          );

          if (!reposRes.ok) {
            const data = await reposRes.json().catch(() => ({}));
            throw new Error(
              data.error ?? `Failed to fetch repos for "${parsed.owner}"`,
            );
          }

          const { repos: reposData } = (await reposRes.json()) as {
            repos: RepoInfo[];
          };

          if (reposData.length === 0) {
            throw new Error(
              `No public repositories found for "${parsed.owner}".`,
            );
          }

          setTotalRepos(reposData.length);
          const allResults: ScanResult[] = [];
          const allFailed: FailedRepo[] = [];

          for (let i = 0; i < reposData.length; i++) {
            if (controller.signal.aborted) break;

            const repo = reposData[i];
            setCurrentRepo(repo.fullName);
            setCurrentIndex(i + 1);

            try {
              const res = await fetch("/api/scan/commits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  owner: repo.owner,
                  repo: repo.name,
                  scanAll,
                }),
                signal: controller.signal,
              });

              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                allFailed.push({
                  fullName: repo.fullName,
                  error: data.error ?? `HTTP ${res.status}`,
                });
                setFailedRepos([...allFailed]);
                continue;
              }

              const result: ScanResult = await res.json();
              result.isPrivate = repo.isPrivate ?? false;
              if (result.rateLimit) {
                setRateLimit(result.rateLimit);
              }
              allResults.push(result);
              setResults([...allResults]);
            } catch (err) {
              if (err instanceof DOMException && err.name === "AbortError") {
                break;
              }
              allFailed.push({
                fullName: repo.fullName,
                error: err instanceof Error ? err.message : "Network error",
              });
              setFailedRepos([...allFailed]);
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User cancelled -- not an error
        } else {
          setError(err instanceof Error ? err.message : "Scan failed");
        }
      } finally {
        abortRef.current = null;
        setScanning(false);
        setScanComplete(true);
      }
    },
    [],
  );

  function handleCancel() {
    abortRef.current?.abort();
  }

  function handleNewScan() {
    setScanComplete(false);
    setResults([]);
    setFailedRepos([]);
    setFailedReposOpen(false);
    setError(null);
    setRateLimit(null);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Public Scan</h1>
        <p className="mt-1 text-muted-foreground">
          Check any public GitHub profile or repository for exposed emails.
          No sign-in required.
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="size-4" />
        <AlertTitle>Rate Limit</AlertTitle>
        <AlertDescription>
          Unauthenticated requests are limited to 60 per hour by GitHub.{" "}
          <Link href="/api/auth/signin" className="font-medium underline">
            Sign in
          </Link>{" "}
          for 5,000 requests/hour and private repo access.
        </AlertDescription>
      </Alert>

      {!scanning && !scanComplete && <PublicScanForm onScan={handleScan} />}

      {scanning && (
        <div className="space-y-4 py-8">
          <ScanProgress
            currentRepo={currentRepo}
            currentIndex={currentIndex}
            totalRepos={totalRepos}
            rateLimit={rateLimit}
          />
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="size-4" />
              Cancel Scan
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Failed repos summary (collapsible) */}
      {scanComplete && failedRepos.length > 0 && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="size-4" />
          <AlertTitle>
            <button
              type="button"
              className="flex w-full items-center gap-1 text-left"
              onClick={() => setFailedReposOpen(!failedReposOpen)}
            >
              <ChevronRight className={cn("size-4 shrink-0 transition-transform", failedReposOpen && "rotate-90")} />
              {failedRepos.length} {failedRepos.length === 1 ? "repository" : "repositories"} could not be scanned
            </button>
          </AlertTitle>
          {failedReposOpen && (
            <AlertDescription>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                {failedRepos.map((f) => (
                  <li key={f.fullName}>
                    <span className="font-medium">{f.fullName}</span>: {f.error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          )}
        </Alert>
      )}

      {scanComplete && (
        <>
          <Separator className="my-8" />
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">Results</h2>
              <div className="flex gap-2">
                {results.some((r) => r.exposedCount > 0) && (
                  <Link href="/guide" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    How to fix this
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleNewScan}>
                  <RotateCcw className="size-4" />
                  New Scan
                </Button>
              </div>
            </div>
            <ScanResults results={results} />
          </div>
        </>
      )}
    </div>
  );
}
