import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { getPrimaryRole, normalizeUser } from "@/lib/domain";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (payload: { email: string; password: string; fullName?: string; organization?: string }) => Promise<{ success: boolean; message?: string }>;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
  canViewPricing: (type: "individual" | "release" | "margin" | "total") => boolean;
  canManageResources: () => boolean;
  canCreateOpportunities: () => boolean;
  canViewAnalytics: () => boolean;
  canViewFinancials: () => boolean;
  canUploadProposals: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function ensureOwnProfile(session: Session) {
  const authUser = session.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (profile) return profile;

  const fallbackName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "User";

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: authUser.id,
        email: authUser.email || "",
        full_name: fallbackName,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        organization: authUser.user_metadata?.organization || null,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateUser = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);

    if (!nextSession?.user) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      await supabase.rpc("bootstrap_first_admin");
      await (supabase as any).rpc("claim_pending_invitation");

      const profile = await ensureOwnProfile(nextSession);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", nextSession.user.id);

      if (rolesError) throw rolesError;

      const normalized = normalizeUser(profile, roles ?? []);
      setUser(normalized ? { ...normalized, role: getPrimaryRole(roles ?? []) } : null);
    } catch (error) {
      console.error("Failed to hydrate auth user", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrateUser(nextSession);
    });

    void supabase.auth.getSession().then(({ data }) => {
      void hydrateUser(data.session);
    });

    return () => subscription.unsubscribe();
  }, [hydrateUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;
    return true;
  }, []);

  const signUp = useCallback(async ({ email, password, fullName, organization }: { email: string; password: string; fullName?: string; organization?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          organization,
        },
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: "Check your inbox to confirm your email before signing in.",
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });

    return !result.error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: "Password reset instructions sent." };
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setIsLoading(true);
    await hydrateUser(data.session);
  }, [hydrateUser]);

  const permissions = useMemo(() => {
    const role = user?.role;

    return {
      canViewPricing: (type: "individual" | "release" | "margin" | "total") => {
        if (!role) return false;
        if (role === "admin") return true;
        if (role === "manager") return type === "individual" || type === "release";
        return type === "individual";
      },
      canManageResources: () => role === "admin" || role === "manager",
      canCreateOpportunities: () => role === "admin" || role === "manager",
      canViewAnalytics: () => role === "admin" || role === "manager",
      canViewFinancials: () => role === "admin",
      canUploadProposals: () => role === "admin" || role === "manager",
    };
  }, [user?.role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session?.user,
        isLoading,
        login,
        signUp,
        signInWithGoogle,
        logout,
        requestPasswordReset,
        refreshUser,
        ...permissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
