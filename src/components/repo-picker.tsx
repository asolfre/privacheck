"use client";

import { useState, useMemo } from "react";
import type { RepoInfo } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Lock, Globe } from "lucide-react";

interface RepoPickerProps {
  repos: RepoInfo[];
  loading?: boolean;
  onScan: (repos: RepoInfo[], scanAll: boolean) => void;
}

export function RepoPicker({ repos, loading, onScan }: RepoPickerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanAll, setScanAll] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = repos;
    if (publicOnly) {
      list = list.filter((r) => !r.isPrivate);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.fullName.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [repos, search, publicOnly]);

  function toggleRepo(fullName: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) {
        next.delete(fullName);
      } else {
        next.add(fullName);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((r) => r.fullName)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function handlePublicOnlyChange(checked: boolean) {
    setPublicOnly(checked);
    if (checked) {
      // Remove any selected private repos
      setSelected((prev) => {
        const publicRepos = new Set<string>();
        for (const fullName of prev) {
          const repo = repos.find((r) => r.fullName === fullName);
          if (repo && !repo.isPrivate) {
            publicRepos.add(fullName);
          }
        }
        return publicRepos;
      });
    }
  }

  function handleScan() {
    const selectedRepos = repos.filter((r) => selected.has(r.fullName));
    onScan(selectedRepos, scanAll);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + bulk actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Deselect All
          </Button>
        </div>
      </div>

      {/* Repo list */}
      <div className="max-h-80 space-y-1 overflow-y-auto rounded-md border p-2">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No repositories found.
          </p>
        ) : (
          filtered.map((repo) => (
            <label
              key={repo.fullName}
              className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
            >
              <Checkbox
                checked={selected.has(repo.fullName)}
                onCheckedChange={() => toggleRepo(repo.fullName)}
              />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {repo.name}
                </span>
                {repo.isPrivate ? (
                  <Lock className="size-3 shrink-0 text-muted-foreground" />
                ) : (
                  <Globe className="size-3 shrink-0 text-muted-foreground" />
                )}
              </div>
              {repo.description && (
                <span className="hidden truncate text-xs text-muted-foreground md:block md:max-w-[200px]">
                  {repo.description}
                </span>
              )}
            </label>
          ))
        )}
      </div>

      {/* Scan options */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-3">
            <Switch
              id="public-only"
              checked={publicOnly}
              onCheckedChange={handlePublicOnlyChange}
            />
            <Label htmlFor="public-only" className="cursor-pointer">
              Public repos only
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="scan-all-auth"
              checked={scanAll}
              onCheckedChange={(checked) => setScanAll(checked)}
            />
            <Label htmlFor="scan-all-auth" className="cursor-pointer">
              Scan all commits
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary">{selected.size} selected</Badge>
          <Button onClick={handleScan} disabled={selected.size === 0}>
            Start Scan
          </Button>
        </div>
      </div>

      {scanAll && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            Scanning all commits may take longer and consume more API rate limit.
            The default scans the last 100 commits per repository.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
