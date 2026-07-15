import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/apiClient";

export type Role = "SUPER_ADMIN" | "MDC_FACILITATOR" | "CC_FACILITATOR";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  /** True while we're still figuring out whether the user is logged in. */
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Wraps the app once, near the root. Responsible for:
 *  1. Tracking the raw Supabase session (login/logout/token refresh)
 *  2. Fetching our own backend's /auth/me once a session exists, to get
 *     the role-bearing profile Supabase itself doesn't know about
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionResolved(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["auth", "me", session?.user.id],
    queryFn: () => apiFetch<{ success: boolean; data: Profile }>("/auth/me").then((r) => r.data),
    enabled: !!session,
    retry: false,
  });

  async function signOut() {
    await supabase.auth.signOut();
  }

  const isLoading = !sessionResolved || (!!session && profileLoading);

  return (
    <AuthContext.Provider value={{ session, profile: profile ?? null, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
