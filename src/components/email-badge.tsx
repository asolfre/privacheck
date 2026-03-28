"use client";

import type { EmailStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EmailBadgeProps {
  status: EmailStatus;
}

export function EmailBadge({ status }: EmailBadgeProps) {
  return (
    <Badge
      variant="default"
      className={cn(
        status === "safe"
          ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-400"
          : "bg-red-500/15 text-red-700 dark:bg-red-500/25 dark:text-red-400"
      )}
    >
      {status === "safe" ? "Safe" : "Exposed"}
    </Badge>
  );
}
