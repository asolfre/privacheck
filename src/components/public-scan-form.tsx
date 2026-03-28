"use client";

import { useState, type FormEvent } from "react";
import type { ParsedGitHubInput } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, AlertTriangle } from "lucide-react";

interface PublicScanFormProps {
  onScan: (parsed: ParsedGitHubInput, scanAll: boolean) => void;
}

function parseGitHubInput(raw: string): ParsedGitHubInput | null {
  const input = raw.trim();
  if (!input) return null;

  // GitHub URL
  if (input.includes("github.com")) {
    try {
      const url = new URL(
        input.startsWith("http") ? input : `https://${input}`
      );
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length === 0) return null;
      if (parts.length === 1) {
        return { type: "user", owner: parts[0] };
      }
      return { type: "repo", owner: parts[0], repo: parts[1] };
    } catch {
      return null;
    }
  }

  // owner/repo (GitHub names allow alphanumerics, hyphens, dots, underscores)
  if (input.includes("/") && !input.includes("://")) {
    const parts = input.split("/").filter(Boolean);
    if (parts.length === 2 && /^[\w.-]+$/.test(parts[0]) && /^[\w.-]+$/.test(parts[1])) {
      return { type: "repo", owner: parts[0], repo: parts[1] };
    }
    return null;
  }

  // single word → username
  if (/^[\w.-]+$/.test(input)) {
    return { type: "user", owner: input };
  }

  return null;
}

export function PublicScanForm({ onScan }: PublicScanFormProps) {
  const [input, setInput] = useState("");
  const [scanAll, setScanAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!input.trim()) {
      setError("Please enter a GitHub username, owner/repo, or URL.");
      return;
    }

    const parsed = parseGitHubInput(input);
    if (!parsed) {
      setError(
        "Could not parse input. Try a GitHub username, owner/repo, or a github.com URL."
      );
      return;
    }

    onScan(parsed, scanAll);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Enter GitHub username, owner/repo, or GitHub URL"
          className="flex-1"
          aria-invalid={!!error}
        />
        <Button type="submit" size="default">
          <Search className="size-4" />
          Scan
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="scan-all"
          checked={scanAll}
          onCheckedChange={(checked) => setScanAll(checked)}
        />
        <Label htmlFor="scan-all" className="cursor-pointer">
          Scan all commits
        </Label>
      </div>

      {scanAll && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            Scanning all commits may take longer and consume more GitHub API rate
            limit. The default scans the last 100 commits per repository.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
