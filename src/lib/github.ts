// ---------------------------------------------------------------------------
// PrivaCheck – GitHub API client
// ---------------------------------------------------------------------------
// Wraps the GitHub REST API for fetching repos and commits, plus a
// higher-level `scanRepoCommits` that combines fetching with email
// classification.
// ---------------------------------------------------------------------------

import { classifyEmail } from "@/lib/email-classifier";
import type {
  CommitEmail,
  RateLimitInfo,
  RepoInfo,
  ScanResult,
} from "@/types";

const GITHUB_API = "https://api.github.com";
const PER_PAGE = 100; // max allowed by GitHub
const FETCH_TIMEOUT_MS = 30_000; // 30 second timeout per request

// ---------------------------------------------------------------------------
// Custom error class for GitHub API errors
// ---------------------------------------------------------------------------

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

/** Fetch with timeout using AbortController */
async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new GitHubApiError(
        `Request to GitHub timed out after ${timeoutMs / 1000}s`,
        408,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/** Extract rate-limit info from response headers */
export function parseRateLimit(res: Response): RateLimitInfo {
  return {
    limit: Number(res.headers.get("x-ratelimit-limit") ?? 0),
    remaining: Number(res.headers.get("x-ratelimit-remaining") ?? 0),
    reset: Number(res.headers.get("x-ratelimit-reset") ?? 0),
    used: Number(res.headers.get("x-ratelimit-used") ?? 0),
  };
}

/** Check if there is a "next" page via the Link header */
function getNextUrl(res: Response): string | null {
  const link = res.headers.get("link");
  if (!link) return null;
  const match = link.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Repos
// ---------------------------------------------------------------------------

/** Fetch all repos for the authenticated user (paginated). */
export async function fetchUserRepos(token: string): Promise<RepoInfo[]> {
  const repos: RepoInfo[] = [];
  let url: string | null =
    `${GITHUB_API}/user/repos?per_page=${PER_PAGE}&sort=updated&direction=desc&type=owner`;

  while (url) {
    const res = await fetchWithTimeout(url, { headers: headers(token) });
    if (!res.ok) {
      throw new GitHubApiError(
        `GitHub API error: ${await res.text()}`,
        res.status,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    for (const r of data) {
      repos.push({
        name: r.name,
        owner: r.owner?.login ?? "",
        fullName: r.full_name,
        isPrivate: r.private,
        defaultBranch: r.default_branch,
        htmlUrl: r.html_url,
        description: r.description,
        updatedAt: r.updated_at,
      });
    }
    url = getNextUrl(res);
  }
  return repos;
}

/** Fetch public repos for a given username (paginated). */
export async function fetchPublicRepos(
  username: string,
  token?: string,
): Promise<RepoInfo[]> {
  const repos: RepoInfo[] = [];
  let url: string | null =
    `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=${PER_PAGE}&sort=updated&direction=desc&type=owner`;

  while (url) {
    const res = await fetchWithTimeout(url, { headers: headers(token) });
    if (!res.ok) {
      if (res.status === 404) {
        throw new GitHubApiError(
          `User "${username}" not found on GitHub.`,
          404,
        );
      }
      throw new GitHubApiError(
        `GitHub API error: ${await res.text()}`,
        res.status,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    for (const r of data) {
      repos.push({
        name: r.name,
        owner: r.owner?.login ?? "",
        fullName: r.full_name,
        isPrivate: r.private,
        defaultBranch: r.default_branch,
        htmlUrl: r.html_url,
        description: r.description,
        updatedAt: r.updated_at,
      });
    }
    url = getNextUrl(res);
  }
  return repos;
}

// ---------------------------------------------------------------------------
// Commits
// ---------------------------------------------------------------------------

interface RawCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string } | null;
    committer: { name: string; email: string; date: string } | null;
  };
}

interface FetchCommitsResult {
  commits: RawCommit[];
  rateLimit: RateLimitInfo;
}

/**
 * Fetch commits for a repo. When `scanAll` is false (default), fetch up to
 * 100 commits (single page). When true, paginate through all commits.
 * Returns commits along with the rate-limit info from the last API response.
 */
export async function fetchCommits(
  owner: string,
  repo: string,
  token?: string,
  scanAll = false,
): Promise<FetchCommitsResult> {
  const commits: RawCommit[] = [];
  let url: string | null =
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=${PER_PAGE}`;
  let lastRateLimit: RateLimitInfo = { limit: 0, remaining: 0, reset: 0, used: 0 };

  while (url) {
    const res = await fetchWithTimeout(url, { headers: headers(token) });
    lastRateLimit = parseRateLimit(res);
    if (!res.ok) {
      if (res.status === 409) {
        // Empty repo – no commits
        return { commits: [], rateLimit: lastRateLimit };
      }
      throw new GitHubApiError(
        `GitHub API error for ${owner}/${repo}: ${await res.text()}`,
        res.status,
      );
    }
    const data: RawCommit[] = await res.json();
    commits.push(...data);

    if (!scanAll) break; // only first page
    url = getNextUrl(res);
  }
  return { commits, rateLimit: lastRateLimit };
}

// ---------------------------------------------------------------------------
// Scan (combines fetch + classify)
// ---------------------------------------------------------------------------

/**
 * Scan a single repo's commits and classify every author/committer email.
 */
export async function scanRepoCommits(
  owner: string,
  repo: string,
  token?: string,
  scanAll = false,
): Promise<ScanResult> {
  const { commits: rawCommits, rateLimit } = await fetchCommits(owner, repo, token, scanAll);

  const commits: CommitEmail[] = [];
  const exposedEmailsSet = new Set<string>();
  let exposedCount = 0;
  let safeCount = 0;

  for (const rc of rawCommits) {
    const authorEmail = rc.commit.author?.email ?? "";
    const committerEmail = rc.commit.committer?.email ?? "";

    const authorClassification = classifyEmail(authorEmail);
    const committerClassification = classifyEmail(committerEmail);

    const isExposed =
      authorClassification.status === "exposed" ||
      committerClassification.status === "exposed";

    if (isExposed) {
      exposedCount++;
      if (authorClassification.status === "exposed") {
        exposedEmailsSet.add(authorClassification.email.toLowerCase());
      }
      if (committerClassification.status === "exposed") {
        exposedEmailsSet.add(committerClassification.email.toLowerCase());
      }
    } else {
      safeCount++;
    }

    commits.push({
      sha: rc.sha,
      shortSha: rc.sha.substring(0, 7),
      message: rc.commit.message.split("\n")[0], // first line only
      authorName: rc.commit.author?.name ?? "Unknown",
      authorEmail,
      authorStatus: authorClassification.status,
      committerName: rc.commit.committer?.name ?? "Unknown",
      committerEmail,
      committerStatus: committerClassification.status,
      htmlUrl: rc.html_url,
      date: rc.commit.author?.date ?? rc.commit.committer?.date ?? "",
    });
  }

  return {
    repo,
    owner,
    fullName: `${owner}/${repo}`,
    totalCommits: commits.length,
    exposedCount,
    safeCount,
    uniqueExposedEmails: Array.from(exposedEmailsSet),
    commits,
    rateLimit,
  };
}
