// ---------------------------------------------------------------------------
// GET /api/scan/repos – List repositories
// ---------------------------------------------------------------------------
// Authenticated: returns user's repos (including private)
// With ?username=X query param: returns public repos for that user
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchUserRepos, fetchPublicRepos, GitHubApiError } from "@/lib/github";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");

  // Public repos for a specific user
  if (username) {
    const session = await auth();
    const token = session?.accessToken;

    try {
      const repos = await fetchPublicRepos(username, token);
      return NextResponse.json({ repos });
    } catch (error) {
      if (error instanceof GitHubApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      const message =
        error instanceof Error ? error.message : "Failed to fetch repositories";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Authenticated user's repos
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in with GitHub." },
      { status: 401 },
    );
  }

  try {
    const repos = await fetchUserRepos(session.accessToken);
    return NextResponse.json({ repos });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch repositories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
