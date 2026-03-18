import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, ChevronRight, FolderOpen, Plus, Save, Sparkles, Target, Trash2, Users } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import {
  useOpportunitiesQuery,
  useProposalRequirementsQuery,
  useProposalsQuery,
  useResourcesQuery,
  useTeamSelectionsQuery,
} from "@/hooks/use-backend-data";
import { supabase } from "@/integrations/supabase/client";
import { getExperienceLevelLabel, getProficiencyLabel, getTierLabel } from "@/lib/domain";
import type { ExperienceLevel, Resource, RoleRequirement, TeamMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function createRequirement(): RoleRequirement {
  return {
    id: crypto.randomUUID(),
    roleName: "",
    requiredSkills: [],
    experienceLevel: "mid",
    effortDays: 30,
    startDate: "",
    endDate: "",
  };
}

function calculateMatchScore(resource: Resource, requirement: RoleRequirement) {
  const reasons: string[] = [];
  let score = 0;

  const matchingSkills = resource.skills.filter((skill) =>
    requirement.requiredSkills.some((requiredSkill) => skill.name.toLowerCase().includes(requiredSkill.toLowerCase())),
  );

  if (requirement.requiredSkills.length > 0) {
    score += Math.min(45, Math.round((matchingSkills.length / requirement.requiredSkills.length) * 45));
  }
  if (matchingSkills.length > 0) {
    reasons.push(`${matchingSkills.length} matching skills`);
    reasons.push(matchingSkills.slice(0, 2).map((skill) => `${skill.name} (${getProficiencyLabel(skill.proficiency)})`).join(", "));
  }

  const expectedYears: Record<ExperienceLevel, number> = { junior: 2, mid: 4, senior: 7, expert: 10 };
  if (resource.vggExperienceYears >= expectedYears[requirement.experienceLevel]) {
    score += 20;
    reasons.push(`${resource.vggExperienceYears} years experience`);
  }

  if (resource.weeklyAvailability >= 20) {
    score += 20;
    reasons.push(`${resource.weeklyAvailability}h/week available`);
  }

  if (resource.tier <= 2) {
    score += 15;
    reasons.push(`Tier ${resource.tier} ${getTierLabel(resource.tier)}`);
  }

  return { score: Math.min(score, 100), reasons: reasons.filter(Boolean) };
}

export default function TeamBuilder() {
  const { user, canUploadProposals, canViewPricing } = useAuth();
  const queryClient = useQueryClient();
  const resourcesQuery = useResourcesQuery();
  const opportunitiesQuery = useOpportunitiesQuery();
  const proposalsQuery = useProposalsQuery();

  const resources = resourcesQuery.data ?? [];
  const opportunities = opportunitiesQuery.data ?? [];
  const proposals = proposalsQuery.data ?? [];
  const proposalIds = useMemo(() => proposals.map((proposal) => proposal.id), [proposals]);
  const requirementsQuery = useProposalRequirementsQuery(proposalIds);
  const teamSelectionsQuery = useTeamSelectionsQuery(proposalIds);

  const proposalRequirements = requirementsQuery.data ?? [];
  const savedSelections = teamSelectionsQuery.data ?? [];

  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalClient, setProposalClient] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [linkedOpportunityId, setLinkedOpportunityId] = useState<string>("none");
  const [requirements, setRequirements] = useState<RoleRequirement[]>([createRequirement()]);
  const [teamSuggestions, setTeamSuggestions] = useState<Map<string, TeamMember[]>>(new Map());
  const [selectedTeam, setSelectedTeam] = useState<Map<string, TeamMember>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loading = resourcesQuery.isLoading || opportunitiesQuery.isLoading || proposalsQuery.isLoading || requirementsQuery.isLoading || teamSelectionsQuery.isLoading;

  const requirementsByProposal = useMemo(() => {
    const map = new Map<string, typeof proposalRequirements>();
    proposalRequirements.forEach((requirement) => {
      const existing = map.get(requirement.proposal_id) ?? [];
      existing.push(requirement);
      map.set(requirement.proposal_id, existing);
    });
    return map;
  }, [proposalRequirements]);

  const selectionsByProposal = useMemo(() => {
    const map = new Map<string, typeof savedSelections>();
    savedSelections.forEach((selection) => {
      const existing = map.get(selection.proposal_id) ?? [];
      existing.push(selection);
      map.set(selection.proposal_id, existing);
    });
    return map;
  }, [savedSelections]);

  const totalCost = useMemo(
    () => Array.from(selectedTeam.values()).reduce((sum, member) => sum + member.totalCost, 0),
    [selectedTeam],
  );

  const addRequirement = () => setRequirements((current) => [...current, createRequirement()]);
  const removeRequirement = (id: string) => setRequirements((current) => current.filter((requirement) => requirement.id !== id));
  const updateRequirement = (id: string, updates: Partial<RoleRequirement>) =>
    setRequirements((current) => current.map((requirement) => (requirement.id === id ? { ...requirement, ...updates } : requirement)));

  const applyOpportunity = (value: string) => {
    setLinkedOpportunityId(value);
    if (value === "none") return;

    const opportunity = opportunities.find((item) => item.id === value);
    if (!opportunity) return;

    setProposalTitle(opportunity.title);
    setProposalClient(opportunity.client || "");
    setProposalDescription(opportunity.description || "");
    setRequirements([
      {
        id: crypto.randomUUID(),
        roleName: opportunity.title,
        requiredSkills: opportunity.required_skills,
        experienceLevel: (opportunity.experience_level as ExperienceLevel) || "mid",
        effortDays: Number(opportunity.effort_days ?? 30),
        startDate: opportunity.start_date || "",
        endDate: opportunity.end_date || "",
      },
    ]);
    setTeamSuggestions(new Map());
    setSelectedTeam(new Map());
  };

  const generateMatches = async () => {
    setIsGenerating(true);
    const nextSuggestions = new Map<string, TeamMember[]>();
    const nextSelected = new Map<string, TeamMember>();

    requirements.forEach((requirement) => {
      const ranked = resources
        .map((resource) => {
          const { score, reasons } = calculateMatchScore(resource, requirement);
          return {
            resourceId: resource.id,
            resource,
            roleName: requirement.roleName,
            matchScore: score,
            matchReasons: reasons,
            dailyRate: resource.pricing.totalBillableRate,
            totalCost: resource.pricing.totalBillableRate * Math.max(requirement.effortDays, 1),
            selected: false,
          } satisfies TeamMember;
        })
        .filter((member) => member.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      nextSuggestions.set(requirement.id, ranked);
      if (ranked[0]) nextSelected.set(requirement.id, { ...ranked[0], selected: true });
    });

    setTeamSuggestions(nextSuggestions);
    setSelectedTeam(nextSelected);
    setIsGenerating(false);
    toast({ title: "Recommendations ready", description: "The builder matched live resources to your requirements." });
  };

  const saveTeamPlan = async () => {
    if (!user) return;
    if (!proposalTitle.trim()) {
      toast({ title: "Proposal title required", description: "Give this team plan a name before saving.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .insert({
        title: proposalTitle,
        client: proposalClient || null,
        description: proposalDescription || null,
        created_by: user.id,
        linked_opportunity_id: linkedOpportunityId !== "none" ? linkedOpportunityId : null,
        builder_mode: "manual",
        status: "draft",
      })
      .select("*")
      .single();

    if (proposalError || !proposal) {
      setIsSaving(false);
      toast({ title: "Could not save team plan", description: proposalError?.message || "Unknown error", variant: "destructive" });
      return;
    }

    const savedRequirements = new Map<string, string>();
    for (const requirement of requirements) {
      const { data, error } = await supabase
        .from("proposal_requirements")
        .insert({
          proposal_id: proposal.id,
          role_name: requirement.roleName,
          required_skills: requirement.requiredSkills,
          experience_level: requirement.experienceLevel,
          effort_days: requirement.effortDays,
          start_date: requirement.startDate || null,
          end_date: requirement.endDate || null,
        })
        .select("*")
        .single();

      if (error || !data) {
        setIsSaving(false);
        toast({ title: "Could not save requirements", description: error?.message || "Unknown error", variant: "destructive" });
        return;
      }

      savedRequirements.set(requirement.id, data.id);
    }

    const selectionPayload = Array.from(selectedTeam.entries())
      .map(([localRequirementId, member]) => ({
        proposal_id: proposal.id,
        requirement_id: savedRequirements.get(localRequirementId) ?? null,
        resource_id: member.resource.id,
        role_name: member.roleName,
        match_score: member.matchScore,
        match_reasons: member.matchReasons,
        daily_rate: member.dailyRate,
        total_cost: member.totalCost,
        selected: true,
      }))
      .filter((selection) => selection.requirement_id);

    if (selectionPayload.length > 0) {
      const { error } = await supabase.from("team_selections").insert(selectionPayload);
      if (error) {
        setIsSaving(false);
        toast({ title: "Plan saved without selections", description: error.message, variant: "destructive" });
        return;
      }
    }

    setIsSaving(false);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["proposals"] }),
      queryClient.invalidateQueries({ queryKey: ["proposal-requirements"] }),
      queryClient.invalidateQueries({ queryKey: ["team-selections"] }),
    ]);

    setProposalTitle("");
    setProposalClient("");
    setProposalDescription("");
    setLinkedOpportunityId("none");
    setRequirements([createRequirement()]);
    setTeamSuggestions(new Map());
    setSelectedTeam(new Map());

    toast({ title: "Team plan saved", description: "Your proposal, requirements, and selected team were saved to the live backend." });
  };

  const loadSavedProposal = (proposalId: string) => {
    const proposal = proposals.find((item) => item.id === proposalId);
    if (!proposal) return;

    const linkedRequirements = requirementsByProposal.get(proposalId) ?? [];
    const linkedSelections = selectionsByProposal.get(proposalId) ?? [];
    const nextRequirements = linkedRequirements.map((requirement) => ({
      id: requirement.id,
      roleName: requirement.role_name,
      requiredSkills: requirement.required_skills,
      experienceLevel: (requirement.experience_level as ExperienceLevel) || "mid",
      effortDays: Number(requirement.effort_days ?? 30),
      startDate: requirement.start_date || "",
      endDate: requirement.end_date || "",
    }));

    const nextSelected = new Map<string, TeamMember>();
    linkedSelections.forEach((selection) => {
      const resource = resources.find((item) => item.id === selection.resource_id);
      if (!resource || !selection.requirement_id) return;
      nextSelected.set(selection.requirement_id, {
        resourceId: resource.id,
        resource,
        roleName: selection.role_name,
        matchScore: Number(selection.match_score ?? 0),
        matchReasons: Array.isArray(selection.match_reasons) ? selection.match_reasons.map(String) : [],
        dailyRate: Number(selection.daily_rate ?? 0),
        totalCost: Number(selection.total_cost ?? 0),
        selected: selection.selected,
      });
    });

    setProposalTitle(proposal.title);
    setProposalClient(proposal.client || "");
    setProposalDescription(proposal.description || "");
    setLinkedOpportunityId(proposal.linked_opportunity_id || "none");
    setRequirements(nextRequirements.length > 0 ? nextRequirements : [createRequirement()]);
    setSelectedTeam(nextSelected);
    setTeamSuggestions(new Map());
    toast({ title: "Saved team loaded", description: "You can continue refining this live proposal." });
  };

  if (!canUploadProposals()) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Only managers and admins can create and save team plans.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Builder</h1>
        <p className="text-muted-foreground">Build actual delivery teams from live resources and save them as reusable proposals.</p>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <Skeleton className="h-[640px] rounded-xl" />
          <Skeleton className="h-[640px] rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Proposal setup</CardTitle>
                <CardDescription>Create a team plan manually or start from an existing opportunity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Proposal title</Label>
                    <Input value={proposalTitle} onChange={(event) => setProposalTitle(event.target.value)} placeholder="e.g. Payments platform delivery squad" />
                  </div>
                  <div className="space-y-2">
                    <Label>Linked opportunity</Label>
                    <Select value={linkedOpportunityId} onValueChange={applyOpportunity}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No linked opportunity</SelectItem>
                        {opportunities.map((opportunity) => (
                          <SelectItem key={opportunity.id} value={opportunity.id}>{opportunity.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Input value={proposalClient} onChange={(event) => setProposalClient(event.target.value)} placeholder="Client name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Workspace owner</Label>
                    <Input value={user?.fullName || ""} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea rows={4} value={proposalDescription} onChange={(event) => setProposalDescription(event.target.value)} placeholder="What is this team being assembled to deliver?" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Role requirements</CardTitle>
                  <CardDescription>Define the positions you need to fill.</CardDescription>
                </div>
                <Button variant="outline" onClick={addRequirement}><Plus className="mr-2 h-4 w-4" />Add role</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {requirements.map((requirement, index) => (
                  <div key={requirement.id} className="space-y-4 rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Role {index + 1}</p>
                      {requirements.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeRequirement(requirement.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Role name</Label>
                        <Input value={requirement.roleName} onChange={(event) => updateRequirement(requirement.id, { roleName: event.target.value })} placeholder="Senior data analyst" />
                      </div>
                      <div className="space-y-2">
                        <Label>Experience level</Label>
                        <Select value={requirement.experienceLevel} onValueChange={(value) => updateRequirement(requirement.id, { experienceLevel: value as ExperienceLevel })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="junior">Junior</SelectItem>
                            <SelectItem value="mid">Mid-level</SelectItem>
                            <SelectItem value="senior">Senior</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Required skills</Label>
                      <Input
                        value={requirement.requiredSkills.join(", ")}
                        onChange={(event) => updateRequirement(requirement.id, { requiredSkills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean) })}
                        placeholder="Python, SQL, Stakeholder Management"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Effort days</Label>
                        <Input type="number" value={requirement.effortDays} onChange={(event) => updateRequirement(requirement.id, { effortDays: Number(event.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Start date</Label>
                        <Input type="date" value={requirement.startDate} onChange={(event) => updateRequirement(requirement.id, { startDate: event.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>End date</Label>
                        <Input type="date" value={requirement.endDate} onChange={(event) => updateRequirement(requirement.id, { endDate: event.target.value })} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void generateMatches()} disabled={isGenerating || requirements.some((requirement) => !requirement.roleName.trim()) || resources.length === 0}>
                    {isGenerating ? "Matching..." : <><Sparkles className="mr-2 h-4 w-4" />Generate recommendations</>}
                  </Button>
                  <Button variant="outline" onClick={() => void saveTeamPlan()} disabled={isSaving || !proposalTitle.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save live team plan"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended team</CardTitle>
                <CardDescription>Deterministic matching based on live skills, availability, and seniority.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {requirements.map((requirement) => {
                  const suggestions = teamSuggestions.get(requirement.id) ?? [];
                  const selected = selectedTeam.get(requirement.id);
                  return (
                    <div key={requirement.id} className="space-y-3 rounded-xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{requirement.roleName || "Untitled role"}</p>
                          <p className="text-sm text-muted-foreground">{getExperienceLevelLabel(requirement.experienceLevel)} • {requirement.effortDays} days</p>
                        </div>
                        {selected && <Badge variant="outline">Selected: {selected.resource.fullName}</Badge>}
                      </div>
                      {suggestions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Generate recommendations to see matching candidates.</p>
                      ) : (
                        <div className="space-y-3">
                          {suggestions.map((member) => (
                            <button
                              key={`${requirement.id}-${member.resourceId}`}
                              type="button"
                              onClick={() => setSelectedTeam((current) => new Map(current).set(requirement.id, { ...member, selected: true }))}
                              className={cn(
                                "w-full rounded-xl border p-4 text-left transition-colors",
                                selected?.resourceId === member.resourceId ? "border-primary bg-primary/5" : "hover:bg-accent/50",
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={member.resource.avatar} />
                                  <AvatarFallback>{member.resource.fullName.split(" ").map((part) => part[0]).join("")}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium">{member.resource.fullName}</p>
                                    <Badge variant="outline">{member.matchScore}% match</Badge>
                                    <Badge variant="outline">Tier {member.resource.tier}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{member.resource.organization || "No organization set"}</p>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {member.matchReasons.map((reason) => (
                                      <span key={reason} className="skill-pill text-xs">{reason}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-right text-sm">
                                  {canViewPricing("total") && <p className="font-semibold">${member.dailyRate}/day</p>}
                                  <p className="text-muted-foreground">{member.resource.weeklyAvailability}h/week</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current summary</CardTitle>
                <CardDescription>Live view of the team you have selected.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTeam.size === 0 ? (
                  <p className="text-sm text-muted-foreground">No team members selected yet.</p>
                ) : (
                  Array.from(selectedTeam.entries()).map(([requirementId, member]) => {
                    const requirement = requirements.find((item) => item.id === requirementId);
                    return (
                      <div key={requirementId} className="flex items-center gap-3 rounded-xl border p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.resource.avatar} />
                          <AvatarFallback>{member.resource.fullName.split(" ").map((part) => part[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{member.resource.fullName}</p>
                          <p className="truncate text-sm text-muted-foreground">{requirement?.roleName || member.roleName}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    );
                  })
                )}
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Selected roles</p>
                  <p className="mt-2 text-2xl font-bold">{selectedTeam.size}/{requirements.length}</p>
                </div>
                {canViewPricing("total") && (
                  <div className="rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">Estimated total</p>
                    <p className="mt-2 text-2xl font-bold">${Math.round(totalCost).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saved team plans</CardTitle>
                <CardDescription>Load any existing live proposal back into the builder.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {proposals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved proposals yet.</p>
                ) : (
                  proposals.map((proposal) => {
                    const requirementCount = requirementsByProposal.get(proposal.id)?.length ?? 0;
                    const selectionCount = selectionsByProposal.get(proposal.id)?.length ?? 0;
                    return (
                      <button key={proposal.id} type="button" className="w-full rounded-xl border p-4 text-left transition-colors hover:bg-accent/50" onClick={() => loadSavedProposal(proposal.id)}>
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-primary/10 p-2 text-primary"><FolderOpen className="h-4 w-4" /></div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{proposal.title}</p>
                            <p className="truncate text-sm text-muted-foreground">{proposal.client || "Client not set"}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="outline">{proposal.status}</Badge>
                              <Badge variant="outline">{requirementCount} roles</Badge>
                              <Badge variant="outline">{selectionCount} selections</Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Production notes</CardTitle>
                <CardDescription>This workflow now persists real data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Team plans save proposals, requirements, and selected resources to the backend.</p>
                <p className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 text-primary" /> Recommendations use live resource profiles only.</p>
                <p className="flex items-start gap-2"><Target className="mt-0.5 h-4 w-4 text-secondary" /> Linked opportunities prefill requirements for faster staffing.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
