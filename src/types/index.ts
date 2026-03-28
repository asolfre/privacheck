// ---------------------------------------------------------------------------
// PrivaCheck – shared TypeScript types
// ---------------------------------------------------------------------------

/** Status returned by the email classifier */
export type EmailStatus = "safe" | "exposed";

/** Result of classifying a single email address */
export interface EmailClassification {
  email: string;
  status: EmailStatus;
  reason: string;
}

/** A single commit with its author/committer email analysis */
export interface CommitEmail {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  authorStatus: EmailStatus;
  committerName: string;
  committerEmail: string;
  committerStatus: EmailStatus;
  htmlUrl: string;
  date: string;
}

/** Aggregated scan result for a single repository */
export interface ScanResult {
  repo: string;
  owner: string;
  fullName: string;
  isPrivate?: boolean;
  totalCommits: number;
  exposedCount: number;
  safeCount: number;
  uniqueExposedEmails: string[];
  commits: CommitEmail[];
  rateLimit?: RateLimitInfo;
}

/** Minimal repo info returned by the repos endpoint */
export interface RepoInfo {
  name: string;
  owner: string;
  fullName: string;
  isPrivate?: boolean;
  defaultBranch?: string;
  htmlUrl?: string;
  description?: string | null;
  updatedAt?: string;
}

/** Request body for the scan/commits API route */
export interface ScanCommitsRequest {
  owner: string;
  repo: string;
  scanAll?: boolean;
}

/** Scan progress event (used for streaming updates to the client) */
export interface ScanProgress {
  currentRepo: string;
  currentRepoIndex: number;
  totalRepos: number;
  status: "scanning" | "complete" | "error";
  result?: ScanResult;
  error?: string;
}

/** GitHub API rate limit info */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  used: number;
}

/** Parsed input from the public scan form */
export interface ParsedGitHubInput {
  type: "user" | "repo";
  owner: string;
  repo?: string;
}
