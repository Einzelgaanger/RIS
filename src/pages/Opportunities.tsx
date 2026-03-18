import { useMemo, useState } from "react";
import { Briefcase, Calendar, CheckCircle, Clock, DollarSign, MapPin, Plus, Search, Send, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useApplicationsQuery, useOpportunitiesQuery, useUserDirectoryQuery } from "@/hooks/use-backend-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getExperienceLevelLabel } from "@/lib/domain";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-success/15 text-success",
  filled: "bg-primary/15 text-primary",
  closed: "bg-destructive/10 text-destructive",
};

const defaultForm = {
  title: "",
  client: "",
  description: "",
  requiredSkills: "",
  experienceLevel: "mid",
  location: "",
  dailyRate: "",
  startDate: "",
  endDate: "",
  effortDays: "",
  visibility: "internal",
};

export default function Opportunities() {
  const { user, canCreateOpportunities, canViewPricing } = useAuth();
  const queryClient = useQueryClient();
  const opportunitiesQuery = useOpportunitiesQuery();
  const applicationsQuery = useApplicationsQuery();
  const userDirectoryQuery = useUserDirectoryQuery();

  const opportunities = opportunitiesQuery.data ?? [];
  const applications = applicationsQuery.data ?? [];
  const userDirectory = userDirectoryQuery.data ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState(defaultForm);

  const selectedOpportunity = useMemo(
    () => opportunities.find((opportunity) => opportunity.id === selectedOpportunityId) ?? null,
    [opportunities, selectedOpportunityId],
  );

  const applicationsByOpportunity = useMemo(() => {
    const map = new Map<string, typeof applications>();
    applications.forEach((application) => {
      const existing = map.get(application.opportunity_id) ?? [];
      existing.push(application);
      map.set(application.opportunity_id, existing);
    });
    return map;
  }, [applications]);

  const userDirectoryMap = useMemo(() => new Map(userDirectory.map((entry) => [entry.userId, entry])), [userDirectory]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opportunity) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        opportunity.title.toLowerCase().includes(query) ||
        (opportunity.client || "").toLowerCase().includes(query) ||
        opportunity.required_skills.some((skill) => skill.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || opportunity.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [opportunities, searchQuery, statusFilter]);

  const selectedApplications = useMemo(
    () => (selectedOpportunity ? applicationsByOpportunity.get(selectedOpportunity.id) ?? [] : []),
    [applicationsByOpportunity, selectedOpportunity],
  );

  const handleCreateOpportunity = async () => {
    if (!user) return;

    setIsSubmitting(true);
    const { error } = await supabase.from("opportunities").insert({
      title: createForm.title,
      client: createForm.client || null,
      description: createForm.description || null,
      required_skills: createForm.requiredSkills.split(",").map((skill) => skill.trim()).filter(Boolean),
      experience_level: createForm.experienceLevel,
      location: createForm.location || null,
      daily_rate: createForm.dailyRate ? Number(createForm.dailyRate) : null,
      start_date: createForm.startDate || null,
      end_date: createForm.endDate || null,
      effort_days: createForm.effortDays ? Number(createForm.effortDays) : null,
      visibility: createForm.visibility,
      status: "draft",
      created_by: user.id,
    });
    setIsSubmitting(false);

    if (error) {
      toast({ title: "Could not create opportunity", description: error.message, variant: "destructive" });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    setCreateForm(defaultForm);
    setShowCreateDialog(false);
    toast({ title: "Opportunity created", description: "The opportunity was saved to the live workspace." });
  };

  const handleExpressInterest = async (opportunityId: string) => {
    if (!user) return;

    const alreadyApplied = applications.some(
      (application) => application.opportunity_id === opportunityId && application.applicant_user_id === user.id,
    );

    if (alreadyApplied) {
      toast({ title: "Already applied", description: "You have already expressed interest in this opportunity." });
      return;
    }

    const { error } = await supabase.from("opportunity_applications").insert({
      opportunity_id: opportunityId,
      applicant_user_id: user.id,
      status: "interested",
    });

    if (error) {
      toast({ title: "Application failed", description: error.message, variant: "destructive" });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["opportunity-applications"] });
    toast({ title: "Interest submitted", description: "Your application is now visible to managers." });
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    const { error } = await supabase.from("opportunity_applications").update({ status }).eq("id", applicationId);
    if (error) {
      toast({ title: "Could not update application", description: error.message, variant: "destructive" });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["opportunity-applications"] });
    toast({ title: "Application updated", description: `Applicant status changed to ${status}.` });
  };

  const handleUpdateOpportunityStatus = async (opportunityId: string, status: string) => {
    const { error } = await supabase.from("opportunities").update({ status }).eq("id", opportunityId);
    if (error) {
      toast({ title: "Could not update opportunity", description: error.message, variant: "destructive" });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    toast({ title: "Opportunity updated", description: `Status changed to ${status}.` });
  };

  const stats = useMemo(
    () => ({
      open: opportunities.filter((opportunity) => opportunity.status === "open").length,
      applicants: applications.length,
      filled: opportunities.filter((opportunity) => opportunity.status === "filled").length,
      duration:
        opportunities.length === 0
          ? 0
          : Math.round(
              opportunities.reduce((total, opportunity) => total + Number(opportunity.effort_days ?? 0), 0) / opportunities.length,
            ),
    }),
    [applications.length, opportunities],
  );

  const loading = opportunitiesQuery.isLoading || applicationsQuery.isLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground">Create roles, track applicants, and staff live delivery work.</p>
        </div>
        {canCreateOpportunities() && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create opportunity
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search title, client, or skill..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Open", value: stats.open, icon: Briefcase, tone: "text-success bg-success/10" },
          { label: "Applicants", value: stats.applicants, icon: Users, tone: "text-primary bg-primary/10" },
          { label: "Filled", value: stats.filled, icon: CheckCircle, tone: "text-secondary bg-secondary/10" },
          { label: "Avg. duration", value: `${stats.duration}d`, icon: Clock, tone: "text-muted-foreground bg-muted" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg p-2", item.tone)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-60 rounded-xl" />
          ))}
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold">No opportunities found</h2>
            <p className="mt-2 text-muted-foreground">This workspace is now live-only, so empty states mean there truly is no data yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOpportunities.map((opportunity) => {
            const applicantCount = applicationsByOpportunity.get(opportunity.id)?.length ?? 0;
            return (
              <Card key={opportunity.id} className="card-interactive" onClick={() => setSelectedOpportunityId(opportunity.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <Badge className={cn("text-xs", statusColors[opportunity.status] ?? statusColors.draft)}>{opportunity.status}</Badge>
                    <span className="text-xs text-muted-foreground">{applicantCount} applicants</span>
                  </div>
                  <CardTitle className="text-base">{opportunity.title}</CardTitle>
                  <CardDescription>{opportunity.client || "Client not set"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{opportunity.description || "No description provided yet."}</p>
                  <div className="flex flex-wrap gap-1">
                    {opportunity.required_skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="skill-pill text-xs">{skill}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{opportunity.location || "TBD"}</div>
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{opportunity.effort_days ?? 0} days</div>
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{opportunity.start_date ? new Date(opportunity.start_date).toLocaleDateString() : "TBD"}</div>
                    {canViewPricing("total") && (
                      <div className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${Number(opportunity.daily_rate ?? 0)}/day</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create opportunity</DialogTitle>
            <DialogDescription>This saves directly to the live backend and becomes visible according to your access rules.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="opp-title">Title</Label>
                <Input id="opp-title" value={createForm.title} onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-client">Client</Label>
                <Input id="opp-client" value={createForm.client} onChange={(event) => setCreateForm((current) => ({ ...current, client: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-description">Description</Label>
              <Textarea id="opp-description" rows={4} value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-skills">Required skills</Label>
              <Input id="opp-skills" placeholder="Python, SQL, Project Management" value={createForm.requiredSkills} onChange={(event) => setCreateForm((current) => ({ ...current, requiredSkills: event.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Experience</Label>
                <Select value={createForm.experienceLevel} onValueChange={(value) => setCreateForm((current) => ({ ...current, experienceLevel: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid-level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-location">Location</Label>
                <Input id="opp-location" value={createForm.location} onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-rate">Daily rate</Label>
                <Input id="opp-rate" type="number" value={createForm.dailyRate} onChange={(event) => setCreateForm((current) => ({ ...current, dailyRate: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="opp-start">Start date</Label>
                <Input id="opp-start" type="date" value={createForm.startDate} onChange={(event) => setCreateForm((current) => ({ ...current, startDate: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-end">End date</Label>
                <Input id="opp-end" type="date" value={createForm.endDate} onChange={(event) => setCreateForm((current) => ({ ...current, endDate: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-effort">Effort days</Label>
                <Input id="opp-effort" type="number" value={createForm.effortDays} onChange={(event) => setCreateForm((current) => ({ ...current, effortDays: event.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={() => void handleCreateOpportunity()} disabled={isSubmitting || !createForm.title.trim()}>
              {isSubmitting ? "Saving..." : "Save opportunity"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedOpportunity} onOpenChange={(open) => !open && setSelectedOpportunityId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedOpportunity && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("text-xs", statusColors[selectedOpportunity.status] ?? statusColors.draft)}>{selectedOpportunity.status}</Badge>
                  <span className="text-xs text-muted-foreground">Posted {new Date(selectedOpportunity.created_at).toLocaleDateString()}</span>
                </div>
                <DialogTitle>{selectedOpportunity.title}</DialogTitle>
                <DialogDescription>{selectedOpportunity.client || "Client not set"}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="mt-4">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  {canCreateOpportunities() && <TabsTrigger value="applicants">Applicants ({selectedApplications.length})</TabsTrigger>}
                </TabsList>

                <TabsContent value="details" className="space-y-4 pt-4">
                  {canCreateOpportunities() && (
                    <div className="space-y-2">
                      <Label>Opportunity status</Label>
                      <Select value={selectedOpportunity.status} onValueChange={(value) => void handleUpdateOpportunityStatus(selectedOpportunity.id, value)}>
                        <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="filled">Filled</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium">Description</h4>
                    <p className="mt-2 text-sm text-muted-foreground">{selectedOpportunity.description || "No description yet."}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="stat-card"><p className="stat-label">Experience</p><p className="font-medium">{getExperienceLevelLabel(selectedOpportunity.experience_level)}</p></div>
                    <div className="stat-card"><p className="stat-label">Duration</p><p className="font-medium">{selectedOpportunity.effort_days ?? 0} days</p></div>
                    <div className="stat-card"><p className="stat-label">Location</p><p className="font-medium">{selectedOpportunity.location || "TBD"}</p></div>
                    {canViewPricing("total") && <div className="stat-card"><p className="stat-label">Daily rate</p><p className="font-medium">${Number(selectedOpportunity.daily_rate ?? 0)}</p></div>}
                  </div>

                  <div>
                    <h4 className="font-medium">Required skills</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedOpportunity.required_skills.map((skill) => (
                        <span key={skill} className="skill-pill">{skill}</span>
                      ))}
                    </div>
                  </div>

                  {selectedOpportunity.status === "open" && user?.role === "professional" && (
                    <Button className="w-full" onClick={() => void handleExpressInterest(selectedOpportunity.id)}>
                      <Send className="mr-2 h-4 w-4" />
                      Express interest
                    </Button>
                  )}
                </TabsContent>

                {canCreateOpportunities() && (
                  <TabsContent value="applicants" className="space-y-3 pt-4">
                    {selectedApplications.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p>No applicants yet</p>
                      </div>
                    ) : (
                      selectedApplications.map((application) => {
                        const applicant = userDirectoryMap.get(application.applicant_user_id);
                        return (
                          <div key={application.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={applicant?.avatarUrl} />
                                <AvatarFallback>{(applicant?.fullName || applicant?.email || "U").split(" ").map((part) => part[0]).join("")}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{applicant?.fullName || applicant?.email || "Applicant"}</p>
                                <p className="text-sm text-muted-foreground">{applicant?.organization || applicant?.email || "Profile available after signup"}</p>
                              </div>
                            </div>
                            <div className="sm:ml-auto sm:w-44">
                              <Select value={application.status} onValueChange={(value) => void handleUpdateApplicationStatus(application.id, value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="interested">Interested</SelectItem>
                                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                  <SelectItem value="selected">Selected</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
