"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-20">
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          {error.message || "An unexpected error occurred. Please try again."}
        </AlertDescription>
      </Alert>

      <Button onClick={reset} variant="outline">
        <RotateCcw className="size-4" />
        Try again
      </Button>
    </div>
  );
}
