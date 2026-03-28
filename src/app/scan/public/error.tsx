"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PublicScanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public scan error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-20">
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>Scan failed</AlertTitle>
        <AlertDescription>
          {error.message || "An error occurred while scanning. This may be due to GitHub API rate limits. Please try again later."}
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          <RotateCcw className="size-4" />
          Try again
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
          <Home className="size-4" />
          Home
        </Link>
      </div>
    </div>
  );
}
