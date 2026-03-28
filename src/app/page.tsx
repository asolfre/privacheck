"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Lock, Globe, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 px-4 pb-16 pt-20 text-center md:pt-28">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>

        <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
          Are your commits leaking your email?
        </h1>

        <p className="max-w-xl text-lg text-muted-foreground">
          Every Git commit records an email address. If you haven&apos;t
          configured privacy settings, your personal email may be publicly
          visible to anyone who looks at your repositories.
        </p>

        <p className="max-w-lg text-sm text-muted-foreground">
          PrivaCheck scans your GitHub commit history, identifies exposed
          emails, and shows you exactly how to fix the problem.
        </p>
      </section>

      {/* CTA Cards */}
      <section className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6 px-4 pb-20 md:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 size-32 -translate-y-8 translate-x-8 rounded-full bg-primary/5" />
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="size-5 text-primary" />
            </div>
            <CardTitle className="mt-2">Full Scan</CardTitle>
            <CardDescription>
              Sign in with GitHub to scan all your repositories, including
              private ones. Uses authenticated API with higher rate limits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoggedIn ? (
              <Link href="/scan" className={cn(buttonVariants(), "w-full")}>
                  Go to Scanner
                  <ArrowRight className="ml-2 size-4" />
              </Link>
            ) : (
              <Link href="/api/auth/signin" className={cn(buttonVariants(), "w-full")}>
                  Sign in with GitHub
                  <ArrowRight className="ml-2 size-4" />
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 size-32 -translate-y-8 translate-x-8 rounded-full bg-muted" />
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Globe className="size-5 text-muted-foreground" />
            </div>
            <CardTitle className="mt-2">Public Check</CardTitle>
            <CardDescription>
              No account needed. Enter a GitHub username or repository URL to
              scan public commits. Limited to 60 API requests per hour.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/scan/public" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                Check a public profile
                <ArrowRight className="ml-2 size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-semibold">
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Connect or Enter",
                desc: "Sign in with GitHub or enter a public username.",
              },
              {
                step: "2",
                title: "Scan Commits",
                desc: "We check each commit for exposed personal emails.",
              },
              {
                step: "3",
                title: "Fix & Protect",
                desc: "Follow our step-by-step guide to secure your email.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center gap-3 text-center"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
          <Shield className="size-4" />
          <span>PrivaCheck &mdash; Your commits, your privacy.</span>
        </div>
      </footer>
    </div>
  );
}
