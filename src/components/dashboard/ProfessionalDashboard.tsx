import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle, Clock, Eye, Send, Users } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import {
  useApplicationsQuery,
  useOpportunitiesQuery,
  useTeamMembersQuery,
  useTeamsQuery,
  useUserDirectoryQuery,
} from '@/hooks/use-backend-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  interested: 'Applied',
  shortlisted: 'Shortlisted',
  selected: 'Selected',
  rejected: 'Not selected',
};

const statusColors: Record<string, string> = {
  interested: 'bg-primary/15 text-primary',
  shortlisted: 'bg-warning/15 text-warning',
  selected: 'bg-success/15 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};

export default function ProfessionalDashboard() {
  const { user } = useAuth();

  const applicationsQuery = useApplicationsQuery();
  const opportunitiesQuery = useOpportunitiesQuery();
  const teamMembersQuery = useTeamMembersQuery();
  const teamsQuery = useTeamsQuery();
  const directoryQuery = useUserDirectoryQuery();

  const applications = applicationsQuery.data ?? [];
  const opportunities = opportunitiesQuery.data ?? [];
  const teamMembers = teamMembersQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const users = directoryQuery.data ?? [];

  const loading =
    applicationsQuery.isLoading ||
    opportunitiesQuery.isLoading ||
    teamMembersQuery.isLoading ||
    teamsQuery.isLoading;

  // My applications
  const myApplications = useMemo(
    () => applications.filter((app) => app.applicant_user_id === user?.id),
    [applications, user?.id],
  );

  const opportunityMap = useMemo(
    () => new Map(opportunities.map((opp) => [opp.id, opp])),
    [opportunities],
  );

  // Open opportunities I haven't applied to
  const availableOpportunities = useMemo(() => {
    const appliedIds = new Set(myApplications.map((app) => app.opportunity_id));
    return opportunities
      .filter((opp) => opp.status === 'open' && !appliedIds.has(opp.id))
      .slice(0, 5);
  }, [myApplications, opportunities]);

  // My teams
  const myMemberships = useMemo(
    () => teamMembers.filter((member) => member.userId === user?.id),
    [teamMembers, user?.id],
  );

  const teamMap = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  const userMap = useMemo(
    () => new Map(users.map((u) => [u.userId, u])),
    [users],
  );

  // Team colleagues
  const myTeamIds = useMemo(
    () => new Set(myMemberships.map((m) => m.teamId)),
    [myMemberships],
  );

  const colleagues = useMemo(
    () =>
      teamMembers
        .filter((m) => myTeamIds.has(m.teamId) && m.userId !== user?.id)
        .map((m) => ({
          ...m,
          teamName: teamMap.get(m.teamId)?.name ?? 'Unknown team',
          fullName: userMap.get(m.userId)?.fullName ?? 'Unknown',
          avatarUrl: userMap.get(m.userId)?.avatarUrl,
        }))
        .slice(0, 8),
    [myTeamIds, teamMembers, teamMap, user?.id, userMap],
  );

  const stats = useMemo(
    () => ({
      totalApplications: myApplications.length,
      selected: myApplications.filter((a) => a.status === 'selected').length,
      openOpportunities: opportunities.filter((o) => o.status === 'open').length,
      myTeams: myMemberships.length,
    }),
    [myApplications, myMemberships.length, opportunities],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            Your personal workspace — track applications, explore opportunities, and stay connected with your team.
          </p>
        </div>
        <Button asChild>
          <Link to="/opportunities">
            <Briefcase className="mr-2 h-4 w-4" />
            Browse Opportunities
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : [
              { label: 'My Applications', value: stats.totalApplications, icon: Send },
              { label: 'Selected', value: stats.selected, icon: CheckCircle },
              { label: 'Open Roles', value: stats.openOpportunities, icon: Briefcase },
              { label: 'My Teams', value: stats.myTeams, icon: Users },
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>Track the status of your interest expressions</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/opportunities">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : myApplications.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <Send className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  You haven't applied to any opportunities yet.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/opportunities">Browse opportunities</Link>
                </Button>
              </div>
            ) : (
              myApplications.slice(0, 5).map((app) => {
                const opp = opportunityMap.get(app.opportunity_id);
                return (
                  <div key={app.id} className="flex items-center justify-between rounded-xl border p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{opp?.title ?? 'Unknown opportunity'}</p>
                      <p className="text-sm text-muted-foreground">
                        {opp?.client || 'Client not set'} · Applied{' '}
                        {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={cn('text-xs', statusColors[app.status] ?? statusColors.interested)}>
                      {statusLabels[app.status] ?? app.status}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Available Opportunities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>New Opportunities</CardTitle>
              <CardDescription>Open roles you haven't applied to yet</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/opportunities">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : availableOpportunities.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <Briefcase className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No new opportunities available right now.
                </p>
              </div>
            ) : (
              availableOpportunities.map((opp) => (
                <Link
                  key={opp.id}
                  to="/opportunities"
                  className="group flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium group-hover:text-primary">{opp.title}</p>
                    <p className="text-sm text-muted-foreground">{opp.client || 'Client not set'}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {opp.required_skills.slice(0, 3).map((skill) => (
        <span key={skill} className="skill-pill text-xs">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <Eye className="ml-3 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Team */}
      <Card>
        <CardHeader>
          <CardTitle>My Team</CardTitle>
          <CardDescription>
            {myMemberships.length === 0
              ? "You haven't been assigned to a team yet"
              : `You're a member of ${myMemberships.length} team${myMemberships.length > 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : myMemberships.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Your manager will assign you to a team. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Team cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {myMemberships.map((membership) => {
                  const team = teamMap.get(membership.teamId);
                  return (
                    <div key={membership.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{team?.name ?? 'Unknown team'}</p>
                        {membership.isTeamLead && (
                          <Badge variant="outline" className="text-xs">Team Lead</Badge>
                        )}
                      </div>
                      {membership.jobTitle && (
                        <p className="mt-1 text-sm text-muted-foreground">{membership.jobTitle}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Joined {new Date(membership.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Colleagues */}
              {colleagues.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Team colleagues</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {colleagues.map((colleague) => (
                      <div key={`${colleague.teamId}-${colleague.userId}`} className="flex items-center gap-3 rounded-xl border p-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={colleague.avatarUrl} />
                          <AvatarFallback className="text-xs">
                            {colleague.fullName.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{colleague.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">{colleague.teamName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
