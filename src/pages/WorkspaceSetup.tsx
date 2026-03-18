import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, MailPlus, ShieldCheck, UserCog, Users2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import {
  useDepartmentsQuery,
  useManagementProfileQuery,
  useManagementProfilesQuery,
  useTeamMembersQuery,
  useTeamsQuery,
  useUserDirectoryQuery,
  useWorkspaceInvitationsQuery,
} from "@/hooks/use-backend-data";
import { supabase } from "@/integrations/supabase/client";
import { getRoleLabel } from "@/lib/domain";
import type { UserRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const backend = supabase as any;

function optionalValue(value: string) {
  return value && value !== "none" ? value : null;
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default function WorkspaceSetup() {
  const { user, canManageResources, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const departmentsQuery = useDepartmentsQuery();
  const teamsQuery = useTeamsQuery();
  const teamMembersQuery = useTeamMembersQuery();
  const invitationsQuery = useWorkspaceInvitationsQuery();
  const directoryQuery = useUserDirectoryQuery();
  const managementProfileQuery = useManagementProfileQuery(user?.id);
  const managementProfilesQuery = useManagementProfilesQuery(user?.role === "admin");

  const departments = departmentsQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const teamMembers = teamMembersQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const users = directoryQuery.data ?? [];
  const managementProfile = managementProfileQuery.data;
  const managementProfiles = managementProfilesQuery.data ?? [];

  const loading = [
    departmentsQuery.isLoading,
    teamsQuery.isLoading,
    teamMembersQuery.isLoading,
    invitationsQuery.isLoading,
    directoryQuery.isLoading,
    managementProfileQuery.isLoading,
    managementProfilesQuery.isLoading,
  ].some(Boolean);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  const [profileTitle, setProfileTitle] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileOfficeLocation, setProfileOfficeLocation] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileResponsibilities, setProfileResponsibilities] = useState("");
  const [profileDepartmentId, setProfileDepartmentId] = useState("none");
  const [profileTeamId, setProfileTeamId] = useState("none");
  const [profileManagerUserId, setProfileManagerUserId] = useState("none");
  const [profileOnboardingCompleted, setProfileOnboardingCompleted] = useState("no");

  const [departmentName, setDepartmentName] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");

  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamDepartmentId, setTeamDepartmentId] = useState("none");
  const [teamManagerUserId, setTeamManagerUserId] = useState("none");

  const [membershipUserId, setMembershipUserId] = useState("none");
  const [membershipTeamId, setMembershipTeamId] = useState("none");
  const [membershipJobTitle, setMembershipJobTitle] = useState("");
  const [membershipLead, setMembershipLead] = useState("no");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(isAdmin ? "manager" : "professional");
  const [inviteTitle, setInviteTitle] = useState("");
  const [inviteOrganization, setInviteOrganization] = useState("");
  const [inviteDepartmentId, setInviteDepartmentId] = useState("none");
  const [inviteTeamId, setInviteTeamId] = useState("none");
  const [inviteNote, setInviteNote] = useState("");
  const [roleUpdatingUserId, setRoleUpdatingUserId] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  useEffect(() => {
    setInviteRole(isAdmin ? "manager" : "professional");
  }, [isAdmin]);

  useEffect(() => {
    setProfileTitle(managementProfile?.title || "");
    setProfilePhone(managementProfile?.phone || "");
    setProfileOfficeLocation(managementProfile?.officeLocation || "");
    setProfileBio(managementProfile?.bio || "");
    setProfileResponsibilities((managementProfile?.responsibilities || []).join("\n"));
    setProfileDepartmentId(managementProfile?.departmentId || "none");
    setProfileTeamId(managementProfile?.primaryTeamId || "none");
    setProfileManagerUserId(managementProfile?.managerUserId || "none");
    setProfileOnboardingCompleted(managementProfile?.onboardingCompleted ? "yes" : "no");
  }, [managementProfile]);

  const pendingInvitations = useMemo(() => invitations.filter((invite) => invite.status === "pending"), [invitations]);

  const userMap = useMemo(() => new Map(users.map((entry) => [entry.userId, entry])), [users]);
  const departmentMap = useMemo<Map<string, (typeof departments)[number]>>(
    () => new Map(departments.map((department) => [department.id, department] as const)),
    [departments],
  );
  const teamMap = useMemo<Map<string, (typeof teams)[number]>>(
    () => new Map(teams.map((team) => [team.id, team] as const)),
    [teams],
  );
  const managers = useMemo(() => users.filter((entry) => entry.role === "admin" || entry.role === "manager"), [users]);

  const enrichedMemberships = useMemo(
    () =>
      teamMembers.map((membership) => ({
        ...membership,
        teamName: teamMap.get(membership.teamId)?.name || "Unknown team",
        departmentName: membership.departmentId ? departmentMap.get(membership.departmentId)?.name || "—" : "—",
        userName: userMap.get(membership.userId)?.fullName || userMap.get(membership.userId)?.email || "Unknown user",
      })),
    [departmentMap, teamMap, teamMembers, userMap],
  );

  const managementRoster = useMemo(
    () =>
      managementProfiles
        .map((profile) => ({
          profile,
          userEntry: userMap.get(profile.userId),
          department: profile.departmentId ? departmentMap.get(profile.departmentId) : undefined,
          team: profile.primaryTeamId ? teamMap.get(profile.primaryTeamId) : undefined,
        }))
        .sort((a, b) => (a.userEntry?.fullName || "").localeCompare(b.userEntry?.fullName || "")),
    [departmentMap, managementProfiles, teamMap, userMap],
  );

  const setupChecks = useMemo(
    () => [
      {
        label: "Management profile completed",
        done: Boolean(managementProfile?.title) && Boolean(managementProfile?.onboardingCompleted),
      },
      {
        label: "Departments defined",
        done: departments.length > 0,
      },
      {
        label: "Teams created",
        done: teams.length > 0,
      },
      {
        label: "Memberships assigned",
        done: teamMembers.length > 0,
      },
    ],
    [departments.length, managementProfile?.onboardingCompleted, managementProfile?.title, teamMembers.length, teams.length],
  );

  const invalidateWorkspace = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
      queryClient.invalidateQueries({ queryKey: ["teams"] }),
      queryClient.invalidateQueries({ queryKey: ["team-members"] }),
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations"] }),
      queryClient.invalidateQueries({ queryKey: ["user-directory"] }),
      queryClient.invalidateQueries({ queryKey: ["management-profile", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["management-profiles"] }),
    ]);
  };

  const handleSaveManagementProfile = async () => {
    if (!user) return;
    setSavingSection("profile");

    const { error } = await backend.from("management_profiles").upsert(
      {
        user_id: user.id,
        title: profileTitle || null,
        phone: profilePhone || null,
        office_location: profileOfficeLocation || null,
        bio: profileBio || null,
        responsibilities: profileResponsibilities
          .split(/\n|,/)
          .map((item: string) => item.trim())
          .filter(Boolean),
        department_id: optionalValue(profileDepartmentId),
        primary_team_id: optionalValue(profileTeamId),
        manager_user_id: optionalValue(profileManagerUserId),
        onboarding_completed: profileOnboardingCompleted === "yes",
      },
      { onConflict: "user_id" },
    );

    setSavingSection(null);

    if (error) {
      toast({ title: "Profile save failed", description: error.message, variant: "destructive" });
      return;
    }

    await invalidateWorkspace();
    toast({ title: "Management profile saved", description: "Your admin/manager workspace profile is ready." });
  };

  const handleCreateDepartment = async () => {
    if (!user || !departmentName.trim()) return;
    setSavingSection("department");
    const { error } = await backend.from("departments").insert({
      name: departmentName.trim(),
      description: departmentDescription.trim() || null,
      created_by: user.id,
    });
    setSavingSection(null);

    if (error) {
      toast({ title: "Department not created", description: error.message, variant: "destructive" });
      return;
    }

    setDepartmentName("");
    setDepartmentDescription("");
    await invalidateWorkspace();
    toast({ title: "Department created", description: "You can now attach teams and managers to it." });
  };

  const handleCreateTeam = async () => {
    if (!user || !teamName.trim()) return;
    setSavingSection("team");
    const { error } = await backend.from("teams").insert({
      name: teamName.trim(),
      description: teamDescription.trim() || null,
      department_id: optionalValue(teamDepartmentId),
      manager_user_id: optionalValue(teamManagerUserId),
      created_by: user.id,
    });
    setSavingSection(null);

    if (error) {
      toast({ title: "Team not created", description: error.message, variant: "destructive" });
      return;
    }

    setTeamName("");
    setTeamDescription("");
    setTeamDepartmentId("none");
    setTeamManagerUserId("none");
    await invalidateWorkspace();
    toast({ title: "Team created", description: "You can now assign members or use it in invitations." });
  };

  const handleAddTeamMember = async () => {
    if (!user || membershipUserId === "none" || membershipTeamId === "none") return;
    setSavingSection("membership");
    const selectedTeam = teams.find((team) => team.id === membershipTeamId);
    const { error } = await backend.from("team_members").insert({
      user_id: membershipUserId,
      team_id: membershipTeamId,
      department_id: selectedTeam?.departmentId || null,
      job_title: membershipJobTitle.trim() || null,
      is_team_lead: membershipLead === "yes",
      created_by: user.id,
    });
    setSavingSection(null);

    if (error) {
      toast({ title: "Membership not saved", description: error.message, variant: "destructive" });
      return;
    }

    setMembershipUserId("none");
    setMembershipTeamId("none");
    setMembershipJobTitle("");
    setMembershipLead("no");
    await invalidateWorkspace();
    toast({ title: "Member assigned", description: "The team structure has been updated." });
  };

  const handleSendInvitation = async () => {
    if (!user || !inviteEmail.trim()) return;
    setSavingSection("invite");
    const { error } = await backend.from("workspace_invitations").insert({
      email: inviteEmail.trim().toLowerCase(),
      full_name: inviteFullName.trim() || null,
      role: isAdmin ? inviteRole : "professional",
      title: inviteTitle.trim() || null,
      organization: inviteOrganization.trim() || null,
      department_id: optionalValue(inviteDepartmentId),
      team_id: optionalValue(inviteTeamId),
      note: inviteNote.trim() || null,
      invited_by: user.id,
    });
    setSavingSection(null);

    if (error) {
      toast({ title: "Invitation not saved", description: error.message, variant: "destructive" });
      return;
    }

    setInviteEmail("");
    setInviteFullName("");
    setInviteTitle("");
    setInviteOrganization("");
    setInviteDepartmentId("none");
    setInviteTeamId("none");
    setInviteNote("");
    setInviteRole(isAdmin ? "manager" : "professional");
    await invalidateWorkspace();
    toast({ title: "Invitation created", description: "The person can sign up with this email and the role/team will be claimed automatically." });
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setSavingSection(invitationId);
    const { error } = await backend.from("workspace_invitations").update({ status: "revoked" }).eq("id", invitationId);
    setSavingSection(null);

    if (error) {
      toast({ title: "Invitation not revoked", description: error.message, variant: "destructive" });
      return;
    }

    await invalidateWorkspace();
    toast({ title: "Invitation revoked", description: "That pending invite can no longer be claimed." });
  };

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    setRoleUpdatingUserId(targetUserId);
    const { error } = await backend.rpc("set_user_role", {
      target_user_id: targetUserId,
      new_role: newRole,
    });
    setRoleUpdatingUserId(null);

    if (error) {
      toast({ title: "Role update failed", description: error.message, variant: "destructive" });
      return;
    }

    await invalidateWorkspace();
    await refreshUser();
    toast({ title: "Role updated", description: "Workspace access changed immediately." });
  };

  if (!canManageResources()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspace setup</h1>
          <p className="text-muted-foreground">Admin and manager tooling for profile setup, teams, and invitation-based access.</p>
        </div>
        <Badge variant="outline">Setup tools only · no auto-seeded data</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)
          : [
              { label: "Departments", value: departments.length, icon: Building2 },
              { label: "Teams", value: teams.length, icon: Users2 },
              { label: "Pending invites", value: pendingInvitations.length, icon: MailPlus },
              { label: "Managers/Admins", value: managementProfiles.length || (isManager ? 1 : 0), icon: UserCog },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="text-3xl font-bold">{item.value}</p>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="structure">Teams</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
          {isAdmin && <TabsTrigger value="access">Roles</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Setup checklist</CardTitle>
                <CardDescription>Use these tools to build a real admin or manager workspace before the team starts operating.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {setupChecks.map((check) => (
                  <div key={check.label} className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-medium">{check.label}</p>
                    </div>
                    <Badge variant={check.done ? "default" : "outline"}>{check.done ? "Ready" : "Pending"}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How invite-based setup works</CardTitle>
                <CardDescription>The system now supports controlled onboarding for leaders and team members.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Create departments and teams first so invitations can land people in the right structure.</p>
                <p>• Send an invitation from this page with the intended role, title, and team assignment.</p>
                <p>• When the invited person signs up using the same email, their role and setup are claimed automatically.</p>
                <p>• Admins can upgrade or downgrade roles anytime from the Roles tab.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Management profile</CardTitle>
              <CardDescription>Define the role context that should already exist when an admin or manager lands in the system.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-title">Title</Label>
                <Input id="profile-title" value={profileTitle} onChange={(event) => setProfileTitle(event.target.value)} placeholder="Operations Manager" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input id="profile-phone" value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} placeholder="+44 20 1234 5678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-office">Office location</Label>
                <Input id="profile-office" value={profileOfficeLocation} onChange={(event) => setProfileOfficeLocation(event.target.value)} placeholder="London HQ" />
              </div>
              <div className="space-y-2">
                <Label>Onboarding completed</Label>
                <Select value={profileOnboardingCompleted} onValueChange={setProfileOnboardingCompleted}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={profileDepartmentId} onValueChange={setProfileDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary team</Label>
                <Select value={profileTeamId} onValueChange={setProfileTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Reporting manager</Label>
                <Select value={profileManagerUserId} onValueChange={setProfileManagerUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reporting manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No reporting manager</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.userId} value={manager.userId}>
                        {manager.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-bio">Bio</Label>
                <Textarea id="profile-bio" value={profileBio} onChange={(event) => setProfileBio(event.target.value)} placeholder="Describe what this manager/admin owns in the workspace." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-responsibilities">Responsibilities</Label>
                <Textarea
                  id="profile-responsibilities"
                  value={profileResponsibilities}
                  onChange={(event) => setProfileResponsibilities(event.target.value)}
                  placeholder="One responsibility per line"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={() => void handleSaveManagementProfile()} disabled={savingSection === "profile"}>
                  {savingSection === "profile" ? "Saving..." : "Save management profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create department</CardTitle>
                <CardDescription>Foundational structure for managers, invitations, and reporting lines.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="department-name">Department name</Label>
                  <Input id="department-name" value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} placeholder="Delivery Operations" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department-description">Description</Label>
                  <Textarea id="department-description" value={departmentDescription} onChange={(event) => setDepartmentDescription(event.target.value)} placeholder="What this department owns" />
                </div>
                <Button onClick={() => void handleCreateDepartment()} disabled={savingSection === "department" || !departmentName.trim()}>
                  {savingSection === "department" ? "Creating..." : "Create department"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create team</CardTitle>
                <CardDescription>Use teams to organize staffing, ownership, and future routing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team name</Label>
                  <Input id="team-name" value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Bid Response Team" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Description</Label>
                  <Textarea id="team-description" value={teamDescription} onChange={(event) => setTeamDescription(event.target.value)} placeholder="What this team does" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={teamDepartmentId} onValueChange={setTeamDepartmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No department</SelectItem>
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Manager</Label>
                    <Select value={teamManagerUserId} onValueChange={setTeamManagerUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No manager assigned</SelectItem>
                        {managers.map((manager) => (
                          <SelectItem key={manager.userId} value={manager.userId}>
                            {manager.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => void handleCreateTeam()} disabled={savingSection === "team" || !teamName.trim()}>
                  {savingSection === "team" ? "Creating..." : "Create team"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assign existing users to teams</CardTitle>
              <CardDescription>Useful when someone already has an account and needs to be placed into the live structure.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={membershipUserId} onValueChange={setMembershipUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select user</SelectItem>
                    {users.map((entry) => (
                      <SelectItem key={entry.userId} value={entry.userId}>
                        {entry.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Team</Label>
                <Select value={membershipTeamId} onValueChange={setMembershipTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="membership-title">Job title</Label>
                <Input id="membership-title" value={membershipJobTitle} onChange={(event) => setMembershipJobTitle(event.target.value)} placeholder="Bid Lead" />
              </div>
              <div className="space-y-2">
                <Label>Team lead</Label>
                <Select value={membershipLead} onValueChange={setMembershipLead}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 xl:col-span-4 flex justify-end">
                <Button onClick={() => void handleAddTeamMember()} disabled={savingSection === "membership" || membershipUserId === "none" || membershipTeamId === "none"}>
                  {savingSection === "membership" ? "Assigning..." : "Assign to team"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current structure</CardTitle>
              <CardDescription>Teams and memberships currently stored in the live workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {departments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No departments created yet.</p>
                ) : (
                  departments.map((department) => (
                    <div key={department.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{department.name}</p>
                          {department.description && <p className="text-sm text-muted-foreground">{department.description}</p>}
                        </div>
                        <Badge variant="outline">{teams.filter((team) => team.departmentId === department.id).length} teams</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role in team</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedMemberships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No team assignments yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrichedMemberships.map((membership) => (
                      <TableRow key={membership.id}>
                        <TableCell className="font-medium">{membership.userName}</TableCell>
                        <TableCell>{membership.teamName}</TableCell>
                        <TableCell>{membership.departmentName}</TableCell>
                        <TableCell>{membership.isTeamLead ? `${membership.jobTitle || "Lead"} · Team lead` : membership.jobTitle || "Member"}</TableCell>
                        <TableCell>{formatDate(membership.joinedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invite a person into the workspace</CardTitle>
              <CardDescription>Managers can invite professionals. Admins can also invite managers and other admins.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="person@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Full name</Label>
                <Input id="invite-name" value={inviteFullName} onChange={(event) => setInviteFullName(event.target.value)} placeholder="Alex Morgan" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={isAdmin ? inviteRole : "professional"} onValueChange={(value) => setInviteRole(value as UserRole)} disabled={!isAdmin}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                    {isAdmin && <SelectItem value="manager">Manager</SelectItem>}
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-title">Title</Label>
                <Input id="invite-title" value={inviteTitle} onChange={(event) => setInviteTitle(event.target.value)} placeholder="Delivery Lead" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-organization">Organization</Label>
                <Input id="invite-organization" value={inviteOrganization} onChange={(event) => setInviteOrganization(event.target.value)} placeholder="GVTS" />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={inviteDepartmentId} onValueChange={setInviteDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Team</Label>
                <Select value={inviteTeamId} onValueChange={setInviteTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="invite-note">Internal note</Label>
                <Textarea id="invite-note" value={inviteNote} onChange={(event) => setInviteNote(event.target.value)} placeholder="Optional setup note for this invitation" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={() => void handleSendInvitation()} disabled={savingSection === "invite" || !inviteEmail.trim()}>
                  {savingSection === "invite" ? "Saving..." : "Create invitation"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending and recent invitations</CardTitle>
              <CardDescription>Invite recipients claim these automatically when they register with the same email.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No invitations created yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invitation.fullName || invitation.email}</p>
                            <p className="text-xs text-muted-foreground">{invitation.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleLabel(invitation.role)}</TableCell>
                        <TableCell>{invitation.teamId ? teamMap.get(invitation.teamId)?.name || "Unknown team" : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={invitation.status === "pending" ? "outline" : "secondary"}>{invitation.status}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
                        <TableCell className="text-right">
                          {invitation.status === "pending" && (
                            <Button variant="outline" size="sm" onClick={() => void handleRevokeInvitation(invitation.id)} disabled={savingSection === invitation.id}>
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Role management</CardTitle>
                <CardDescription>Admins control who operates as admin, manager, or professional.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {users.map((member) => (
                  <div key={member.userId} className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{member.fullName}</p>
                        <Badge variant="outline">{getRoleLabel(member.role)}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                      {member.organization && <p className="text-sm text-muted-foreground">{member.organization}</p>}
                    </div>
                    <div className="w-full md:w-48">
                      <Select
                        value={member.role}
                        onValueChange={(value) => void handleRoleChange(member.userId, value as UserRole)}
                        disabled={member.userId === user?.id || roleUpdatingUserId === member.userId}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leadership roster</CardTitle>
                <CardDescription>Quick visibility into how admins and managers are currently set up.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Primary team</TableHead>
                      <TableHead>Profile status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {managementRoster.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No admin or manager profiles have been completed yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      managementRoster.map((entry) => (
                        <TableRow key={entry.profile.id}>
                          <TableCell className="font-medium">{entry.userEntry?.fullName || entry.profile.userId}</TableCell>
                          <TableCell>{getRoleLabel(entry.userEntry?.role)}</TableCell>
                          <TableCell>{entry.profile.title || "—"}</TableCell>
                          <TableCell>{entry.department?.name || "—"}</TableCell>
                          <TableCell>{entry.team?.name || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={entry.profile.onboardingCompleted ? "default" : "outline"}>
                              {entry.profile.onboardingCompleted ? "Ready" : "Incomplete"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Production note</CardTitle>
              <CardDescription>This setup is live and backed by database permissions, not local-only state.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Invites are claim-based today: the user signs up with the invited email and the system assigns their role and structure automatically.</p>
          <p>• Admins can fully manage roles; managers can operate teams and invite professionals.</p>
          <p>• Auth emails already work with the default flow. Branded email templates can be layered on next.</p>
        </CardContent>
      </Card>
    </div>
  );
}
