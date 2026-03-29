"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Settings, Terminal, GitBranch, Copy, Check, ArrowLeft } from "lucide-react";
import { PrivaCheckLogo } from "@/components/icons/privacheck-logo";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 pr-12 text-sm">
        <code>{children}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/scan"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-4"
          )}
        >
          <ArrowLeft className="size-4" />
          Back to scan
        </Link>
        <h1 className="text-3xl font-bold">Fix Your Commit Email Privacy</h1>
        <p className="mt-2 text-muted-foreground">
          Follow these three steps to stop exposing your personal email in Git
          commits and optionally rewrite your existing history.
        </p>
      </div>

      {/* TODO: Future enhancement - personalize with user's actual noreply
          email and detected exposed emails from scan results */}

      <Accordion
        multiple
        defaultValue={["step-1", "step-2", "step-3"]}
        className="space-y-4"
      >
        {/* Step 1 */}
        <AccordionItem value="step-1" className="rounded-lg border px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </div>
              <div className="flex items-center gap-2">
                <Settings className="size-4" />
                <span className="font-semibold">
                  Enable email privacy on GitHub
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6 pt-2">
            <ol className="list-inside list-decimal space-y-3 text-sm">
              <li>
                Go to{" "}
                <a
                  href="https://github.com/settings/emails"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  GitHub Settings &rarr; Emails
                </a>
              </li>
              <li>
                Check{" "}
                <strong>&quot;Keep my email addresses private&quot;</strong>
              </li>
              <li>
                Check{" "}
                <strong>
                  &quot;Block command line pushes that expose my email&quot;
                </strong>
              </li>
            </ol>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="mb-2 text-sm font-medium">
                  Your noreply email address
                </p>
                <p className="text-sm text-muted-foreground">
                  GitHub provides you a private noreply email in the format:
                </p>
                <CodeBlock>
                  {`ID+USERNAME@users.noreply.github.com`}
                </CodeBlock>
                <p className="mt-2 text-xs text-muted-foreground">
                  You can find your exact noreply address on the{" "}
                  <a
                    href="https://github.com/settings/emails"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Emails settings page
                  </a>
                  . For accounts created before July 18, 2017, the format may be{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    USERNAME@users.noreply.github.com
                  </code>
                  .
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Step 2 */}
        <AccordionItem value="step-2" className="rounded-lg border px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="size-4" />
                <span className="font-semibold">
                  Update your local Git config
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6 pt-2">
            <p className="text-sm text-muted-foreground">
              Set your noreply email as the default for all future commits:
            </p>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                For all repositories (global)
              </p>
              <CodeBlock>
                {`git config --global user.email "ID+USERNAME@users.noreply.github.com"`}
              </CodeBlock>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                For a single repository
              </p>
              <CodeBlock>
                {`git config user.email "ID+USERNAME@users.noreply.github.com"`}
              </CodeBlock>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Verify the change
              </p>
              <CodeBlock>{`git config --global user.email`}</CodeBlock>
            </div>

            <p className="text-sm text-muted-foreground">
              All <strong>future</strong> commits will now use your noreply
              email. Existing commits are <em>not</em> affected &mdash; see
              Step 3 to fix those.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Step 3 */}
        <AccordionItem value="step-3" className="rounded-lg border px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </div>
              <div className="flex items-center gap-2">
                <GitBranch className="size-4" />
                <span className="font-semibold">
                  Rewrite existing commit history
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6 pt-2">
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Warning: destructive operation</AlertTitle>
              <AlertDescription>
                Rewriting history changes commit SHAs and requires a force push.
                This will break open pull requests, invalidate references, and
                affect all collaborators. Only do this if you understand the
                consequences. <strong>Back up your repository first.</strong>
              </AlertDescription>
            </Alert>

            <Separator />

            {/* Method A */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">
                Method A: git filter-repo (recommended)
              </h4>
              <p className="text-sm text-muted-foreground">
                <code className="rounded bg-muted px-1 text-xs">
                  git-filter-repo
                </code>{" "}
                is the modern, faster replacement for{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  git filter-branch
                </code>
                .
              </p>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Install
                </p>
                <CodeBlock>{`pip install git-filter-repo`}</CodeBlock>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Run
                </p>
                <CodeBlock>
                  {`git filter-repo --email-callback '
    return email.replace(b"your-real-email@example.com",
                         b"ID+USERNAME@users.noreply.github.com")
'`}
                </CodeBlock>
              </div>
            </div>

            <Separator />

            {/* Method B */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">
                Method B: git filter-branch (legacy)
              </h4>
              <p className="text-sm text-muted-foreground">
                Older method, still works but slower on large repos.
              </p>

              <CodeBlock>
                {`git filter-branch --env-filter '
OLD_EMAIL="your-real-email@example.com"
NEW_EMAIL="ID+USERNAME@users.noreply.github.com"

if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]; then
    export GIT_COMMITTER_EMAIL="$NEW_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]; then
    export GIT_AUTHOR_EMAIL="$NEW_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags`}
              </CodeBlock>
            </div>

            <Separator />

            {/* Force push */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Force push the changes</h4>
              <p className="text-sm text-muted-foreground">
                After rewriting, you must force push to update the remote:
              </p>
              <CodeBlock>
                {`git push --force --tags origin 'refs/heads/*'`}
              </CodeBlock>
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  Coordinate with your team before force pushing. All
                  collaborators will need to re-clone or rebase their local
                  copies.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer note */}
      <div className="mt-10 flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
        <PrivaCheckLogo className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium">You&apos;re taking the right step</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Once you&apos;ve completed these steps, all new commits will use your
            noreply email, and GitHub will block any accidental pushes that
            expose your real address.
          </p>
        </div>
      </div>
    </div>
  );
}
