import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { BarChart3, Briefcase, DollarSign, PieChart as PieChartIcon, Target, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useAuth } from "@/contexts/AuthContext";
import { useOpportunitiesQuery, useProposalsQuery, useResourcesQuery } from "@/hooks/use-backend-data";
import { buildAnalytics } from "@/lib/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--success))", "hsl(var(--warning))"];

export default function Analytics() {
  const { canViewAnalytics, canViewFinancials } = useAuth();
  const resourcesQuery = useResourcesQuery();
  const opportunitiesQuery = useOpportunitiesQuery();
  const proposalsQuery = useProposalsQuery();

  const resources = resourcesQuery.data ?? [];
  const opportunities = opportunitiesQuery.data ?? [];
  const proposals = proposalsQuery.data ?? [];
  const isLoading = resourcesQuery.isLoading || opportunitiesQuery.isLoading || proposalsQuery.isLoading;

  const analytics = useMemo(() => buildAnalytics(resources, opportunities, proposals), [resources, opportunities, proposals]);

  const organizationData = useMemo(() => {
    const map = new Map<string, number>();
    resources.forEach((resource) => {
      const key = resource.organization || "Unassigned";
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [resources]);

  const locationData = useMemo(() => {
    const map = new Map<string, number>();
    resources.forEach((resource) => {
      const key = resource.location.country || "Unknown";
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [resources]);

  const pipelineData = useMemo(
    () =>
      opportunities.map((opportunity) => ({
        name: opportunity.title.length > 18 ? `${opportunity.title.slice(0, 18)}…` : opportunity.title,
        value: Number(opportunity.daily_rate ?? 0) * Number(opportunity.effort_days ?? 0),
      }))
      .filter((item) => item.value > 0)
      .slice(0, 6),
    [opportunities],
  );

  const utilizationBreakdown = useMemo(
    () => [
      { name: "Allocated", value: Math.max(analytics.totalResources - analytics.availableResources, 0) },
      { name: "Available", value: analytics.availableResources },
    ],
    [analytics.availableResources, analytics.totalResources],
  );

  if (!canViewAnalytics()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Live operational insights from your production data.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)
          : [
              { label: "Resources", value: analytics.totalResources, icon: Users },
              { label: "Open opportunities", value: analytics.openOpportunities, icon: Briefcase },
              { label: "Active proposals", value: proposals.filter((proposal) => proposal.status === "in_progress").length, icon: Target },
              { label: "Utilization", value: `${analytics.utilizationRate}%`, icon: BarChart3 },
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

      {!isLoading && resources.length === 0 && opportunities.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <Badge variant="outline">No live metrics yet</Badge>
            <h2 className="mt-4 text-xl font-semibold">Analytics will populate as your team uses the platform.</h2>
            <p className="mt-2 text-muted-foreground">Add resources, open opportunities, and save team plans to unlock reporting.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resource distribution</CardTitle>
                <CardDescription>Headcount by organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={organizationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                      <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilization split</CardTitle>
                <CardDescription>Available versus allocated capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={utilizationBreakdown} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
                        {utilizationBreakdown.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {utilizationBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="ml-auto font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top skill gaps</CardTitle>
                <CardDescription>Demand versus current supply</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.skillsGap.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No opportunity demand has been captured yet.</p>
                ) : (
                  analytics.skillsGap.map((item) => (
                    <div key={item.skill} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.skill}</p>
                          <p className="text-sm text-muted-foreground">Supply {item.supply} • Demand {item.demand}</p>
                        </div>
                        <Badge variant="outline">{item.demand - item.supply > 0 ? `${item.demand - item.supply} gap` : "Covered"}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Opportunity pipeline</CardTitle>
                <CardDescription>Estimated value by opportunity</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelineData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add rates and effort estimates to opportunities to track pipeline value.</p>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pipelineData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" width={120} />
                        <Tooltip
                          formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, "Value"]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Geographic coverage</CardTitle>
                <CardDescription>Active resource locations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {locationData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No location data available yet.</p>
                ) : (
                  locationData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-3 rounded-xl border p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{index + 1}</div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.value} resources</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {canViewFinancials() && (
              <Card>
                <CardHeader>
                  <CardTitle>Financial snapshot</CardTitle>
                  <CardDescription>Derived from current resource pricing</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" /> Billable value
                    </div>
                    <p className="mt-3 text-3xl font-bold">${Math.round(analytics.totalRevenue).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <PieChartIcon className="h-4 w-4" /> Margin
                    </div>
                    <p className="mt-3 text-3xl font-bold">{analytics.averageMargin}%</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
