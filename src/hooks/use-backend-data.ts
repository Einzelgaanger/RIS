import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { normalizeResource } from "@/lib/domain";

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
