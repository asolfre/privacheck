"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RateLimitInfo, RepoInfo, ScanResult } from "@/types";
import { RepoPicker } from "@/components/repo-picker";
import { ScanResults } from "@/components/scan-results";
import { ScanProgress } from "@/components/scan-progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ArrowRight, ChevronRight, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FailedRepo {
  fullName: string;
  error: string;
}

export default function ScanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [currentRepo, setCurrentRepo] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalRepos, setTotalRepos] = useState(0);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [failedRepos, setFailedRepos] = useState<FailedRepo[]>([]);
  const [failedReposOpen, setFailedReposOpen] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch repos on mount
  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadRepos() {
      try {
        const res = await fetch("/api/scan/repos");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to fetch repositories");
        }
        const data = await res.json();
        setRepos(data.repos);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repos");
      } finally {
        setLoadingRepos(false);
      }
    }

    loadRepos();
  }, [status]);

  const handleScan = useCallback(
    async (selectedRepos: RepoInfo[], scanAll: boolean) => {
      const controller = new AbortController();
      abortRef.current = controller;

      setScanning(true);
      setScanComplete(false);
      setResults([]);
      setFailedRepos([]);
      setFailedReposOpen(false);
      setError(null);
      setRateLimit(null);
      setTotalRepos(selectedRepos.length);

      const allResults: ScanResult[] = [];
      const allFailed: FailedRepo[] = [];

      for (let i = 0; i < selectedRepos.length; i++) {
        // Check if scan was cancelled
        if (controller.signal.aborted) break;

        const repo = selectedRepos[i];
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
          result.isPrivate = repo.isPrivate;
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

      abortRef.current = null;
      setScanning(false);
      setScanComplete(true);
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

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex items-center gap-3">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Scan Your Repositories</h1>
        <p className="mt-1 text-muted-foreground">
          Select the repositories you want to scan for exposed email addresses.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!scanning && !scanComplete && (
        <RepoPicker
          repos={repos}
          loading={loadingRepos}
          onScan={handleScan}
        />
      )}

      {scanning && (
        <div className="space-y-4 py-8">
          <ScanProgress
            currentRepo={currentRepo}
            currentIndex={currentIndex}
            totalRepos={totalRepos}
            rateLimit={rateLimit}
          />
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <X className="size-4" />
              Cancel Scan
            </Button>
          </div>
        </div>
      )}

      {/* Failed repos summary (collapsible) */}
      {scanComplete && failedRepos.length > 0 && (
        <Alert variant="destructive" className="mb-6">
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

      {(results.length > 0 || scanComplete) && (
        <>
          <Separator className="my-8" />
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">Results</h2>
              <div className="flex gap-2">
                {scanComplete && results.some((r) => r.exposedCount > 0) && (
                  <Link href="/guide" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    How to fix this
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                )}
                {scanComplete && (
                  <Button variant="ghost" size="sm" onClick={handleNewScan}>
                    <RotateCcw className="size-4" />
                    New Scan
                  </Button>
                )}
              </div>
            </div>
            <ScanResults results={results} />
          </div>
        </>
      )}
    </div>
  );
}
