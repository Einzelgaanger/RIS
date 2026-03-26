import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Briefcase,
  Globe,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  User,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useResourcesQuery, useApplicationsQuery, useOpportunitiesQuery, useTeamMembersQuery, useTeamsQuery } from "@/hooks/use-backend-data";
import { supabase } from "@/integrations/supabase/client";
import type { Skill, Certification, Resource } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function emptySkill(): Skill {
  return { name: "", proficiency: 3, yearsExperience: 1, validated: false };
}

function emptyCertification(): Certification {
  return { name: "", issuer: "", year: new Date().getFullYear() };
}

export default function MyProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const resourcesQuery = useResourcesQuery();
  const applicationsQuery = useApplicationsQuery();
  const opportunitiesQuery = useOpportunitiesQuery();
  const teamMembersQuery = useTeamMembersQuery();
  const teamsQuery = useTeamsQuery();

  const resources = resourcesQuery.data ?? [];
  const applications = applicationsQuery.data ?? [];
  const opportunities = opportunitiesQuery.data ?? [];
  const teamMembers = teamMembersQuery.data ?? [];
  const teams = teamsQuery.data ?? [];

  // Find the user's own resource (linked via profile)
  const myResource = useMemo(() => {
    // First try matching by profile_id
    const byProfile = resources.find((r) => r.email === user?.email);
    return byProfile ?? null;
  }, [resources, user?.email]);

  // Form state
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [remote, setRemote] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState("40");
  const [monthlyAvailability, setMonthlyAvailability] = useState("160");
  const [skills, setSkills] = useState<Skill[]>([emptySkill()]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when resource loads
  useEffect(() => {
    if (myResource) {
      setTitle(myResource.title || "");
      setBio(myResource.aiBidReadySummary || "");
      setCity(myResource.location.city || "");
      setCountry(myResource.location.country || "");
      setRemote(myResource.location.remote);
      setWeeklyAvailability(String(myResource.weeklyAvailability));
      setMonthlyAvailability(String(myResource.monthlyAvailability));
      setSkills(myResource.skills.length > 0 ? myResource.skills : [emptySkill()]);
      setCertifications(myResource.certifications);
    }
  }, [myResource]);

  const myApplications = useMemo(
    () => applications.filter((a) => a.applicant_user_id === user?.id),
    [applications, user?.id],
  );

  const oppMap = useMemo(
    () => new Map(opportunities.map((o) => [o.id, o])),
    [opportunities],
  );

  const myMemberships = useMemo(
    () => teamMembers.filter((m) => m.userId === user?.id),
    [teamMembers, user?.id],
  );

  const teamMap = useMemo<Map<string, { id: string; name: string }>>(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams],
  );

  const addSkill = () => setSkills((prev) => [...prev, emptySkill()]);
  const removeSkill = (index: number) => setSkills((prev) => prev.filter((_, i) => i !== index));
  const updateSkill = (index: number, updates: Partial<Skill>) =>
    setSkills((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));

  const addCertification = () => setCertifications((prev) => [...prev, emptyCertification()]);
  const removeCertification = (index: number) =>
    setCertifications((prev) => prev.filter((_, i) => i !== index));
  const updateCertification = (index: number, updates: Partial<Certification>) =>
    setCertifications((prev) => prev.map((c, i) => (i === index ? { ...c, ...updates } : c)));

  const handleSave = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);

    const cleanSkills = skills
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        proficiency: s.proficiency,
        yearsExperience: s.yearsExperience,
        validated: s.validated,
      })) as unknown as Record<string, unknown>[];

    const cleanCerts = certifications
      .filter((c) => c.name.trim())
      .map((c) => ({ name: c.name, issuer: c.issuer, year: c.year })) as unknown as Record<string, unknown>[];

    // Get profile id
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profileRow) {
      setIsSaving(false);
      toast({ title: "Profile not found", variant: "destructive" });
      return;
    }

    const resourceData: any = {
      full_name: user.fullName,
      email: user.email,
      title: title || null,
      ai_bid_ready_summary: bio || null,
      city: city || null,
      country: country || null,
      remote,
      weekly_availability: Number(weeklyAvailability) || 0,
      monthly_availability: Number(monthlyAvailability) || 0,
      skills: cleanSkills,
      certifications: cleanCerts,
      organization: user.organization || null,
      profile_id: profileRow.id,
      created_by: user.id,
    };

    let error: any;

    if (myResource) {
      // Find the actual DB row ID
      const { data: dbResource } = await supabase
        .from("resources")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (dbResource) {
        const result = await supabase
          .from("resources")
          .update(resourceData)
          .eq("id", dbResource.id);
        error = result.error;
      }
    } else {
      const result = await supabase.from("resources").insert(resourceData);
      error = result.error;
    }

    setIsSaving(false);

    if (error) {
      toast({ title: "Could not save profile", description: error.message, variant: "destructive" });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["resources"] });
    toast({ title: "Profile saved", description: "Your professional profile has been updated." });
  }, [user, title, bio, city, country, remote, weeklyAvailability, monthlyAvailability, skills, certifications, myResource, queryClient]);

  const loading = resourcesQuery.isLoading;

  const statusLabels: Record<string, string> = {
    interested: "Applied",
    shortlisted: "Shortlisted",
    selected: "Selected",
    rejected: "Not selected",
  };

  const statusColors: Record<string, string> = {
    interested: "bg-primary/15 text-primary",
    shortlisted: "bg-warning/15 text-warning",
    selected: "bg-success/15 text-success",
    rejected: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-border">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {user?.fullName?.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user?.fullName}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">{user?.role}</Badge>
              {myResource && <Badge variant="secondary">Resource profile linked</Badge>}
            </div>
          </div>
        </div>
        <Button onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save profile
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="profile"><User className="mr-1.5 h-4 w-4 hidden sm:inline" />Profile</TabsTrigger>
          <TabsTrigger value="skills"><Award className="mr-1.5 h-4 w-4 hidden sm:inline" />Skills</TabsTrigger>
          <TabsTrigger value="availability"><Globe className="mr-1.5 h-4 w-4 hidden sm:inline" />Availability</TabsTrigger>
          <TabsTrigger value="activity"><Briefcase className="mr-1.5 h-4 w-4 hidden sm:inline" />Activity</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          {loading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your professional bio and contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Data Analyst" />
                  </div>
                  <div className="space-y-2">
                    <Label>Organization</Label>
                    <Input value={user?.organization || ""} disabled className="bg-muted" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Professional Summary / Bio</Label>
                  <Textarea
                    rows={5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a brief summary of your expertise, accomplishments, and what you bring to delivery teams…"
                  />
                  <p className="text-xs text-muted-foreground">This is used for AI-powered bid summaries and team matching.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Skills & Expertise</CardTitle>
                <CardDescription>Add your skills with proficiency levels.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addSkill}>
                <Plus className="mr-2 h-4 w-4" />Add skill
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {skills.map((skill, index) => (
                <div key={index} className="space-y-3 rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Skill {index + 1}</Label>
                    <Button variant="ghost" size="icon" onClick={() => removeSkill(index)} className="shrink-0 h-7 w-7">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_8rem_6rem]">
                    <div className="space-y-1">
                      <Label className="text-xs">Skill name</Label>
                      <Input
                        value={skill.name}
                        onChange={(e) => updateSkill(index, { name: e.target.value })}
                        placeholder="e.g. Python, Project Management"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Proficiency</Label>
                      <Select
                        value={String(skill.proficiency)}
                        onValueChange={(v) => updateSkill(index, { proficiency: Number(v) as Skill["proficiency"] })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 – Junior</SelectItem>
                          <SelectItem value="2">2 – Intermediate</SelectItem>
                          <SelectItem value="3">3 – Proficient</SelectItem>
                          <SelectItem value="4">4 – Advanced</SelectItem>
                          <SelectItem value="5">5 – Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Years</Label>
                      <Input
                        type="number"
                        min="0"
                        value={skill.yearsExperience}
                        onChange={(e) => updateSkill(index, { yearsExperience: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Certifications</CardTitle>
                <CardDescription>Professional certifications and qualifications.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addCertification}>
                <Plus className="mr-2 h-4 w-4" />Add certification
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {certifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No certifications added yet.</p>
              ) : (
                certifications.map((cert, index) => (
                  <div key={index} className="space-y-3 rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Certification {index + 1}</Label>
                      <Button variant="ghost" size="icon" onClick={() => removeCertification(index)} className="shrink-0 h-7 w-7">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_10rem_6rem]">
                      <div className="space-y-1">
                        <Label className="text-xs">Certification</Label>
                        <Input
                          value={cert.name}
                          onChange={(e) => updateCertification(index, { name: e.target.value })}
                          placeholder="e.g. AWS Solutions Architect"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Issuer</Label>
                        <Input
                          value={cert.issuer}
                          onChange={(e) => updateCertification(index, { issuer: e.target.value })}
                          placeholder="e.g. Amazon"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Year</Label>
                        <Input
                          type="number"
                          value={cert.year}
                          onChange={(e) => updateCertification(index, { year: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location & Availability</CardTitle>
              <CardDescription>Where you're based and how much capacity you have.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lagos" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Nigeria" />
                </div>
                <div className="space-y-2">
                  <Label>Work style</Label>
                  <Select value={remote ? "remote" : "onsite"} onValueChange={(v) => setRemote(v === "remote")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Weekly availability (hours)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="168"
                    value={weeklyAvailability}
                    onChange={(e) => setWeeklyAvailability(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly availability (hours)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="720"
                    value={monthlyAvailability}
                    onChange={(e) => setMonthlyAvailability(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <p className="text-3xl font-bold">{myApplications.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Applications</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-3xl font-bold">{myApplications.filter((a) => a.status === "selected").length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Selected</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-3xl font-bold">{myMemberships.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Teams</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No applications yet.</p>
              ) : (
                myApplications.map((app) => {
                  const opp = oppMap.get(app.opportunity_id);
                  return (
                    <div key={app.id} className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <p className="font-medium">{opp?.title ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {opp?.client || "Client not set"} · {new Date(app.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={cn("text-xs", statusColors[app.status])}>
                        {statusLabels[app.status] ?? app.status}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Teams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myMemberships.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not assigned to any teams yet.</p>
              ) : (
                myMemberships.map((m) => {
                  const team = teamMap.get(m.teamId);
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <p className="font-medium">{team?.name ?? "Unknown"}</p>
                        {m.jobTitle && <p className="text-xs text-muted-foreground">{m.jobTitle}</p>}
                      </div>
                      {m.isTeamLead && <Badge variant="outline">Team Lead</Badge>}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
