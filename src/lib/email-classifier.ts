// ---------------------------------------------------------------------------
// PrivaCheck – Email classification logic
// ---------------------------------------------------------------------------
// Determines whether a commit email is a safe GitHub noreply address or
// an exposed personal email.
// ---------------------------------------------------------------------------

import type { EmailClassification, EmailStatus } from "@/types";

/** Known safe email domains / patterns */
const NOREPLY_PATTERNS = [
  // Modern noreply: ID+USERNAME@users.noreply.github.com
  // Legacy noreply: USERNAME@users.noreply.github.com
  /@users\.noreply\.github\.com$/i,
];

const SAFE_EXACT_EMAILS = new Set([
  "noreply@github.com",
  "actions@github.com",
  "41898282+github-actions[bot]@users.noreply.github.com",
]);

/**
 * Check if an email is a GitHub noreply address.
 */
export function isNoreplyEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();

  if (SAFE_EXACT_EMAILS.has(normalized)) {
    return true;
  }

  return NOREPLY_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Check if a string looks like a valid email address.
 * We keep this simple – we just need to distinguish real emails from
 * placeholder values like "(none)" or empty strings.
 */
export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Classify an email address as safe or exposed.
 */
export function classifyEmail(email: string): EmailClassification {
  const trimmed = email.trim();

  if (!trimmed || !looksLikeEmail(trimmed)) {
    return {
      email: trimmed || "(empty)",
      status: "safe" as EmailStatus,
      reason: "Not a real email address",
    };
  }

  if (isNoreplyEmail(trimmed)) {
    return {
      email: trimmed,
      status: "safe" as EmailStatus,
      reason: "GitHub noreply address",
    };
  }

  return {
    email: trimmed,
    status: "exposed" as EmailStatus,
    reason: "Personal email exposed in commit metadata",
  };
}
