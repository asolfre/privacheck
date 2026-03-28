"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { Menu, X, Shield } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/scan", label: "Scan" },
  { href: "/scan/public", label: "Public Check" },
  { href: "/guide", label: "Guide" },
] as const;

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = !!session?.user;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight"
        >
          <Shield className="size-5" />
          PrivaCheck
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                pathname === link.href && "bg-muted text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth section */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "User avatar"}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                )}
                {session.user?.name && (
                  <span className="text-sm font-medium">
                    {session.user.name}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => signIn("github")}
            >
              Sign in with GitHub
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {/* Mobile dropdown */}
      <div
        className={cn(
          "overflow-hidden border-t transition-all md:hidden",
          mobileOpen ? "max-h-80" : "max-h-0 border-t-0"
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                pathname === link.href && "bg-muted text-foreground"
              )}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="my-1 h-px bg-border" />

          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "User avatar"}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                {session.user?.name && (
                  <span className="text-sm font-medium">
                    {session.user.name}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => signIn("github")}
            >
              Sign in with GitHub
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
