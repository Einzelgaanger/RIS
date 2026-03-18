import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, DollarSign, FileText, Sparkles, Target, Users } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useOpportunitiesQuery, useProposalsQuery, useResourcesQuery } from '@/hooks/use-backend-data';
import { buildAnalytics } from '@/lib/domain';
import ResourceCard from '@/components/resources/ResourceCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user, canViewAnalytics, canViewFinancials } = useAuth();
  const resourcesQuery = useResourcesQuery();
  const opportunitiesQuery = useOpportunitiesQuery();
  const proposalsQuery = useProposalsQuery();

  const resources = resourcesQuery.data ?? [];
  const opportunities = opportunitiesQuery.data ?? [];
  const proposals = proposalsQuery.data ?? [];

  const analytics = useMemo(() => buildAnalytics(resources, opportunities, proposals), [resources, opportunities, proposals]);
  const availableResources = useMemo(() => resources.filter((resource) => resource.weeklyAvailability >= 20).slice(0, 3), [resources]);
  const openOpportunities = useMemo(() => opportunities.filter((opportunity) => opportunity.status === 'open').slice(0, 5), [opportunities]);

  const loading = resourcesQuery.isLoading || opportunitiesQuery.isLoading || proposalsQuery.isLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Welcome back, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-muted-foreground">This workspace now runs on live backend data only.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/reports">
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button asChild>
            <Link to="/team-builder">
              <Sparkles className="mr-2 h-4 w-4" />
              Build Team
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)
          : [
              { label: 'Resources', value: analytics.totalResources, icon: Users },
              { label: 'Open Opportunities', value: analytics.openOpportunities, icon: Briefcase },
              { label: 'Live Proposals', value: proposals.length, icon: FileText },
              { label: 'Utilization', value: `${analytics.utilizationRate}%`, icon: Target },
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

      {!loading && resources.length === 0 && opportunities.length === 0 && proposals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-8">
            <Badge variant="outline">Clean production workspace</Badge>
            <div>
              <h2 className="text-xl font-semibold">No demo data remains</h2>
              <p className="text-muted-foreground">Start by adding resources, creating an opportunity, or saving a proposal in Team Builder.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/opportunities">Create opportunity</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/team-builder">Open Team Builder</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Available resources</CardTitle>
                <CardDescription>Top currently available profiles</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/resources">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)
              ) : availableResources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No available resources yet.</p>
              ) : (
                availableResources.map((resource) => <ResourceCard key={resource.id} resource={resource} compact />)
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Open opportunities</CardTitle>
                <CardDescription>Current delivery demand</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/opportunities">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)
              ) : openOpportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open opportunities yet.</p>
              ) : (
                openOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium">{opportunity.title}</h3>
                        <p className="text-sm text-muted-foreground">{opportunity.client || 'Client not set'}</p>
                      </div>
                      <Badge variant="outline">{opportunity.status}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {opportunity.required_skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="skill-pill text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {canViewAnalytics() && !loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Available now</p>
              <p className="mt-2 text-2xl font-bold">{analytics.availableResources}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Top skills tracked</p>
              <p className="mt-2 text-2xl font-bold">{analytics.topSkills.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Average margin</p>
              <p className="mt-2 text-2xl font-bold">{analytics.averageMargin}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Pipeline value</p>
              <p className="mt-2 text-2xl font-bold">${Math.round(analytics.totalRevenue).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {canViewFinancials() && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Financial visibility</CardTitle>
            <CardDescription>Live totals derived from current resource pricing data.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Total billable value</p>
              <p className="mt-2 text-3xl font-bold">${Math.round(analytics.totalRevenue).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Base + release cost</p>
              <p className="mt-2 text-3xl font-bold">${Math.round(analytics.totalCost).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
