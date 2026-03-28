"use client";

import { useState, useMemo } from "react";
import type { ScanResult } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmailBadge } from "@/components/email-badge";
import {
  ShieldCheck,
  ShieldAlert,
  Mail,
  CheckCircle,
  Inbox,
  Lock,
  Globe,
  X,
} from "lucide-react";

interface ScanResultsProps {
  results: ScanResult[];
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export function ScanResults({ results }: ScanResultsProps) {
  const [emailFilter, setEmailFilter] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalCommits = results.reduce((s, r) => s + r.totalCommits, 0);
    const exposedCount = results.reduce((s, r) => s + r.exposedCount, 0);
    const uniqueEmails = [
      ...new Set(results.flatMap((r) => r.uniqueExposedEmails)),
    ];
    return { totalCommits, exposedCount, uniqueEmails };
  }, [results]);

  // No results at all
  if (results.length === 0) {
    return (
      <Alert>
        <Inbox className="size-4" />
        <AlertTitle>No results</AlertTitle>
        <AlertDescription>
          No repositories were scanned. Try selecting different repositories or
          check if the repositories have any commits.
        </AlertDescription>
      </Alert>
    );
  }

  // Had results but no commits found in any repo
  if (stats.totalCommits === 0) {
    return (
      <Alert>
        <Inbox className="size-4" />
        <AlertTitle>No commits found</AlertTitle>
        <AlertDescription>
          The scanned repositories don&apos;t appear to have any commits.
          This can happen with empty or freshly initialized repositories.
        </AlertDescription>
      </Alert>
    );
  }

  // All commits are safe
  if (stats.exposedCount === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <CheckCircle className="size-4" />
          <AlertTitle>All clear!</AlertTitle>
          <AlertDescription>
            Scanned {stats.totalCommits.toLocaleString()} commits across{" "}
            {results.length} {results.length === 1 ? "repository" : "repositories"}.
            No exposed personal emails were found.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<ShieldCheck className="size-4" />}
            label="Total Commits"
            value={stats.totalCommits}
          />
          <StatCard
            icon={<ShieldAlert className="size-4" />}
            label="Exposed Commits"
            value={0}
            variant="safe"
          />
          <StatCard
            icon={<Mail className="size-4" />}
            label="Unique Exposed Emails"
            value={0}
            variant="safe"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<ShieldCheck className="size-4" />}
          label="Total Commits"
          value={stats.totalCommits}
        />
        <StatCard
          icon={<ShieldAlert className="size-4" />}
          label="Exposed Commits"
          value={stats.exposedCount}
          variant="danger"
        />
        <StatCard
          icon={<Mail className="size-4" />}
          label="Unique Exposed Emails"
          value={stats.uniqueEmails.length}
          variant="danger"
        />
      </div>

      {/* Exposed emails list (clickable to filter) */}
      {stats.uniqueEmails.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Detected Exposed Emails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {stats.uniqueEmails.map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() =>
                    setEmailFilter((prev) => (prev === email ? null : email))
                  }
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    emailFilter === email
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  }`}
                >
                  {email}
                  {emailFilter === email && <X className="size-3" />}
                </button>
              ))}
            </div>
            {emailFilter && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  Filtering by: <span className="font-medium text-foreground">{emailFilter}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setEmailFilter(null)}
                  className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs hover:bg-muted"
                >
                  <X className="size-3" />
                  Clear
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Show All</TabsTrigger>
          <TabsTrigger value="exposed">Exposed Only</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <RepoTables results={results} filter="all" emailFilter={emailFilter} />
        </TabsContent>
        <TabsContent value="exposed">
          <RepoTables results={results} filter="exposed" emailFilter={emailFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function VisibilityBadge({ isPrivate }: { isPrivate?: boolean }) {
  if (isPrivate === undefined) return null;
  return isPrivate ? (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      <Lock className="size-3" />
      Private
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      <Globe className="size-3" />
      Public
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant?: "safe" | "danger";
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`text-2xl font-bold tabular-nums ${
            variant === "danger"
              ? "text-destructive"
              : variant === "safe"
                ? "text-green-500"
                : ""
          }`}
        >
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

function RepoTables({
  results,
  filter,
  emailFilter,
}: {
  results: ScanResult[];
  filter: "all" | "exposed";
  emailFilter?: string | null;
}) {
  return (
    <div className="mt-4 space-y-8">
      {results.map((result) => {
        let commits = result.commits;

        if (filter === "exposed") {
          commits = commits.filter(
            (c) =>
              c.authorStatus === "exposed" ||
              c.committerStatus === "exposed",
          );
        }

        if (emailFilter) {
          commits = commits.filter(
            (c) =>
              c.authorEmail === emailFilter ||
              c.committerEmail === emailFilter,
          );
        }

        if (commits.length === 0) {
          return (
            <div key={result.fullName} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">{result.fullName}</h3>
                <VisibilityBadge isPrivate={result.isPrivate} />
              </div>
              <p className="text-sm text-muted-foreground">
                {filter === "exposed" && emailFilter
                  ? "No exposed commits matching this email in this repository."
                  : filter === "exposed"
                    ? "No exposed commits in this repository."
                    : emailFilter
                      ? "No commits matching this email in this repository."
                      : "No commits in this repository."}
              </p>
            </div>
          );
        }

        return (
          <div key={result.fullName} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{result.fullName}</h3>
              <VisibilityBadge isPrivate={result.isPrivate} />
              <span className="text-xs text-muted-foreground">
                {result.totalCommits} commits &middot;{" "}
                {result.exposedCount > 0 ? (
                  <span className="text-destructive">
                    {result.exposedCount} exposed
                  </span>
                ) : (
                  <span className="text-green-500">all safe</span>
                )}
              </span>
            </div>

            {/* Desktop: scrollable table (hidden below md) */}
            <div className="hidden overflow-x-auto rounded-md border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Commit</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Message
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Author Email</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Committer Email
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commits.map((commit) => {
                    const isExposed =
                      commit.authorStatus === "exposed" ||
                      commit.committerStatus === "exposed";
                    return (
                      <TableRow key={commit.sha}>
                        <TableCell>
                          <a
                            href={commit.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-primary underline-offset-2 hover:underline"
                          >
                            {commit.shortSha}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(commit.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span
                            className="text-xs"
                            title={commit.message}
                          >
                            {truncate(commit.message, 50)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="max-w-[200px] truncate text-xs">
                              {commit.authorEmail || "-"}
                            </span>
                            <EmailBadge status={commit.authorStatus} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="max-w-[200px] truncate text-xs">
                              {commit.committerEmail || "-"}
                            </span>
                            <EmailBadge status={commit.committerStatus} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <EmailBadge
                            status={isExposed ? "exposed" : "safe"}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: card layout (hidden at md and above) */}
            <div className="space-y-3 md:hidden">
              {commits.map((commit) => {
                const isExposed =
                  commit.authorStatus === "exposed" ||
                  commit.committerStatus === "exposed";
                return (
                  <div
                    key={commit.sha}
                    className={`rounded-lg border p-3 ${
                      isExposed
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border"
                    }`}
                  >
                    {/* Top row: SHA + date + status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <a
                          href={commit.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-primary underline-offset-2 hover:underline"
                        >
                          {commit.shortSha}
                        </a>
                        <span className="text-xs text-muted-foreground">
                          {new Date(commit.date).toLocaleDateString()}
                        </span>
                      </div>
                      <EmailBadge status={isExposed ? "exposed" : "safe"} />
                    </div>

                    {/* Message */}
                    {commit.message && (
                      <p
                        className="mt-1.5 text-xs text-muted-foreground"
                        title={commit.message}
                      >
                        {truncate(commit.message, 80)}
                      </p>
                    )}

                    {/* Email rows */}
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          Author:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="max-w-[180px] truncate text-xs">
                            {commit.authorEmail || "-"}
                          </span>
                          <EmailBadge status={commit.authorStatus} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          Committer:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="max-w-[180px] truncate text-xs">
                            {commit.committerEmail || "-"}
                          </span>
                          <EmailBadge status={commit.committerStatus} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
