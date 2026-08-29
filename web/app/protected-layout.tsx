"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRavAuth } from "./auth-context";

export function RavProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isReady } = useRavAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady) {
    return <div className="page-shell">Loading session…</div>;
  }

  if (!isAuthenticated) {
    return <div className="page-shell">Redirecting to login…</div>;
  }

  return <>{children}</>;
}

export const ProtectedLayout = RavProtectedLayout;
