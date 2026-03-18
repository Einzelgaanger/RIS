import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { getPrimaryRole, normalizeResource } from "@/lib/domain";
import type { Department, ManagementProfile, Team, TeamMembership, UserRole, WorkspaceInvitation } from "@/types";

const backend = supabase as any;

export interface UserDirectoryEntry {
  userId: string;
  email: string;
  fullName: string;
  organization: string;
  avatarUrl?: string;
  role: UserRole;
}

function mapDepartment(row: any): Department {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTeam(row: any): Team {
  return {
    id: row.id,
    departmentId: row.department_id || undefined,
    name: row.name,
    description: row.description || undefined,
    managerUserId: row.manager_user_id || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapManagementProfile(row: any): ManagementProfile {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || undefined,
    phone: row.phone || undefined,
    officeLocation: row.office_location || undefined,
    bio: row.bio || undefined,
    responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
    departmentId: row.department_id || undefined,
    primaryTeamId: row.primary_team_id || undefined,
    managerUserId: row.manager_user_id || undefined,
    onboardingCompleted: Boolean(row.onboarding_completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTeamMembership(row: any): TeamMembership {
  return {
    id: row.id,
    teamId: row.team_id,
    userId: row.user_id,
    departmentId: row.department_id || undefined,
    jobTitle: row.job_title || undefined,
    isTeamLead: Boolean(row.is_team_lead),
    joinedAt: row.joined_at,
    createdBy: row.created_by,
  };
}

function mapWorkspaceInvitation(row: any): WorkspaceInvitation {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || undefined,
    role: row.role,
    title: row.title || undefined,
    organization: row.organization || undefined,
    departmentId: row.department_id || undefined,
    teamId: row.team_id || undefined,
    invitedBy: row.invited_by,
    status: row.status,
    inviteToken: row.invite_token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at || undefined,
    acceptedUserId: row.accepted_user_id || undefined,
    note: row.note || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

export function useDepartmentsQuery() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await backend.from("departments").select("*").order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapDepartment);
    },
  });
}

export function useTeamsQuery() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await backend.from("teams").select("*").order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapTeam);
    },
  });
}

export function useManagementProfileQuery(userId?: string) {
  return useQuery({
    queryKey: ["management-profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await backend.from("management_profiles").select("*").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data ? mapManagementProfile(data) : null;
    },
  });
}

export function useManagementProfilesQuery(enabled = true) {
  return useQuery({
    queryKey: ["management-profiles"],
    enabled,
    queryFn: async () => {
      const { data, error } = await backend.from("management_profiles").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapManagementProfile);
    },
  });
}

export function useTeamMembersQuery() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await backend.from("team_members").select("*").order("joined_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapTeamMembership);
    },
  });
}

export function useWorkspaceInvitationsQuery() {
  return useQuery({
    queryKey: ["workspace-invitations"],
    queryFn: async () => {
      const { data, error } = await backend.from("workspace_invitations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapWorkspaceInvitation);
    },
  });
}
