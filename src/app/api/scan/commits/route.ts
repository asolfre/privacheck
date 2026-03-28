// ---------------------------------------------------------------------------
// POST /api/scan/commits – Scan a repo's commits for exposed emails
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scanRepoCommits, GitHubApiError } from "@/lib/github";
import type { ScanCommitsRequest } from "@/types";

export async function POST(req: NextRequest) {
  let body: ScanCommitsRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { owner, repo, scanAll } = body;

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Both 'owner' and 'repo' fields are required." },
      { status: 400 },
    );
  }

  // Use auth token if available (higher rate limit + private repo access)
  const session = await auth();
  const token = session?.accessToken;

  try {
    const result = await scanRepoCommits(owner, repo, token, scanAll ?? false);
    return NextResponse.json(result);
  } catch (error) {
    // Handle typed GitHub API errors
    if (error instanceof GitHubApiError) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: `Repository "${owner}/${repo}" not found or is private.` },
          { status: 404 },
        );
      }
      if (error.status === 403) {
        return NextResponse.json(
          {
            error:
              "GitHub API rate limit exceeded. Please sign in for a higher limit, or wait and try again.",
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to scan commits";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
