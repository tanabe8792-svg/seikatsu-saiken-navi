"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  formatVerifiedIdentityLabel,
  identityFromSupabaseUser,
  isAnonymousSupabaseUser,
  type VerifiedIdentity,
} from "@/lib/auth/identity";
import {
  getAuthUser,
  sendEmailVerificationLink,
  signInWithLineOAuth,
  signOutVerifiedUser,
  subscribeToAuthChanges,
} from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface AuthContextValue {
  loading: boolean;
  configured: boolean;
  identity: VerifiedIdentity | null;
  identityLabel: string | null;
  sendEmailVerificationLink: (
    email: string
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  signInWithLine: () => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function resolveIdentity(user: User | null): VerifiedIdentity | null {
  if (!user || isAnonymousSupabaseUser(user)) return null;
  return identityFromSupabaseUser(user);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<VerifiedIdentity | null>(null);
  const configured = isSupabaseConfigured();

  const refresh = useCallback(async () => {
    if (!configured) {
      setIdentity(null);
      setLoading(false);
      return;
    }
    const user = await getAuthUser();
    setIdentity(resolveIdentity(user));
    setLoading(false);
  }, [configured]);

  useEffect(() => {
    void refresh();
    if (!configured) return;
    return subscribeToAuthChanges((user) => {
      setIdentity(resolveIdentity(user));
      setLoading(false);
    });
  }, [configured, refresh]);

  const signOut = useCallback(async () => {
    await signOutVerifiedUser();
    setIdentity(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      configured,
      identity,
      identityLabel: identity ? formatVerifiedIdentityLabel(identity) : null,
      sendEmailVerificationLink,
      signInWithLine: signInWithLineOAuth,
      signOut,
      refresh,
    }),
    [loading, configured, identity, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
