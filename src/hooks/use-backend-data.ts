import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { getPrimaryRole, normalizeResource } from "@/lib/domain";
import type { UserRole } from "@/types";

export interface UserDirectoryEntry {
  userId: string;
  email: string;
  fullName: string;
  organization: string;
  avatarUrl?: string;
  role: UserRole;
}

export function useResourcesQuery() {
  return useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resources").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(normalizeResource);
    },
  });
}

export function useOpportunitiesQuery() {
  return useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useApplicationsQuery() {
  return useQuery({
    queryKey: ["opportunity-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunity_applications")
        .select("*")
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProfilesQuery(userIds: string[] = []) {
  return useQuery({
    queryKey: ["profiles", ...userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").in("user_id", userIds);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjectsQuery() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProposalsQuery() {
  return useQuery({
    queryKey: ["proposals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("proposals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProposalRequirementsQuery(proposalIds: string[] = []) {
  return useQuery({
    queryKey: ["proposal-requirements", ...proposalIds],
    enabled: proposalIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposal_requirements")
        .select("*")
        .in("proposal_id", proposalIds)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTeamSelectionsQuery(proposalIds: string[] = []) {
  return useQuery({
    queryKey: ["team-selections", ...proposalIds],
    enabled: proposalIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_selections")
        .select("*")
        .in("proposal_id", proposalIds)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUserDirectoryQuery() {
  return useQuery({
    queryKey: ["user-directory"],
    queryFn: async () => {
      const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;

      const roleMap = new Map<string, { role: "admin" | "manager" | "professional" }[]>();
      (roles ?? []).forEach((roleRow) => {
        const existing = roleMap.get(roleRow.user_id) ?? [];
        existing.push({ role: roleRow.role });
        roleMap.set(roleRow.user_id, existing);
      });

      return (profiles ?? [])
        .map((profile) => ({
          userId: profile.user_id,
          email: profile.email,
          fullName: profile.full_name || profile.email.split("@")[0],
          organization: profile.organization || "",
          avatarUrl: profile.avatar_url || undefined,
          role: getPrimaryRole(roleMap.get(profile.user_id) ?? []),
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
    },
  });
}
