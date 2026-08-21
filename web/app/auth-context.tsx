"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SessionStatus = {
  status: string;
  verified: boolean;
  email: string;
  username?: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isVerified: boolean;
  isReady: boolean;
  user: SessionStatus | null;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  terminateOnClose: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionStatus | null>(null);
  const [isReady, setIsReady] = useState(false);
  const closeRequestInFlight = useRef(false);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/auth/session-status",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        setUser(null);
        return false;
      }

      const payload = (await response.json()) as SessionStatus;
      setUser(payload);
      return true;
    } catch {
      setUser(null);
      return false;
    } finally {
      setIsReady(true);
    }
  }, []);

  const terminateOnClose = useCallback(async () => {
    if (closeRequestInFlight.current) {
      return;
    }

    closeRequestInFlight.current = true;
    try {
      await fetch("http://localhost:8000/api/v1/auth/session/terminate", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // Intentionally fail closed without surfacing an error to the browser session close flow.
    } finally {
      setUser(null);
      closeRequestInFlight.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("http://localhost:8000/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // Ignore network issues during logout; the client state is still cleared.
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const publicPaths = new Set(["/", "/login"]);

    if (!isReady) {
      return;
    }

    if (pathname === "/login" && user?.status === "active") {
      router.replace("/home");
      return;
    }

    if (!publicPaths.has(pathname) && !user) {
      router.replace("/login");
    }
  }, [isReady, pathname, router, user]);

  useEffect(() => {
    const handleClose = () => {
      void terminateOnClose();
    };

    const handleBeforeUnload = () => {
      void terminateOnClose();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void terminateOnClose();
      }
    };

    window.addEventListener("pagehide", handleClose);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pagehide", handleClose);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [terminateOnClose]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user?.status === "active" || user?.verified),
      isVerified: Boolean(user?.verified),
      isReady,
      user,
      refreshSession,
      logout,
      terminateOnClose,
    }),
    [isReady, logout, refreshSession, terminateOnClose, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth requires an AuthProvider");
  }

  return context;
}
