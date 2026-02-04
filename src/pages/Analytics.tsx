import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { mockAnalyticsData, mockResources, mockOpportunities } from '@/data/mockData';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Target, BarChart3,
  PieChart as PieChartIcon, Activity, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(210 100% 40%)', 'hsl(16 100% 60%)', 'hsl(160 84% 39%)', 'hsl(38 92% 50%)'];
const TIER_COLORS = ['hsl(45 93% 47%)', 'hsl(0 0% 70%)', 'hsl(30 50% 50%)', 'hsl(210 10% 60%)'];

export default function Analytics() {
  const { user, canViewAnalytics } = useAuth();

  if (!canViewAnalytics()) {
    return <Navigate to="/dashboard" replace />;
  }

  const analytics = mockAnalyticsData;

  // Calculate additional metrics
  const metrics = useMemo(() => {
    const margin = ((analytics.totalRevenue - analytics.totalCost) / analytics.totalRevenue * 100);
    const avgDailyRate = mockResources.reduce((acc, r) => acc + r.pricing.totalBillableRate, 0) / mockResources.length;
    const benchStrength = mockResources.filter(r => r.weeklyAvailability >= 30).length;
    
    return {
      margin: margin.toFixed(1),
      avgDailyRate: Math.round(avgDailyRate),
      benchStrength,
      utilizationChange: analytics.utilizationTrend[analytics.utilizationTrend.length - 1].rate - 
                         analytics.utilizationTrend[0].rate,
    };
  }, [analytics]);

  // Skills radar data
  const skillsRadarData = analytics.topSkills.map(s => ({
    skill: s.skill,
    count: s.count,
    fullMark: 30,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Platform performance and resource intelligence insights
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                metrics.utilizationChange >= 0 ? "text-success" : "text-destructive"
              )}>
                {metrics.utilizationChange >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(metrics.utilizationChange)}%
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold">{analytics.utilizationRate}%</p>
              <p className="text-sm text-muted-foreground">Utilization Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <Badge variant="outline" className="text-success border-success text-xs">
                {metrics.margin}% margin
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold">${(analytics.totalRevenue / 1000000).toFixed(2)}M</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <span className="text-xs text-muted-foreground">
                {metrics.benchStrength} on bench
              </span>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold">{analytics.totalResources}</p>
              <p className="text-sm text-muted-foreground">Total Resources</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-warning/10">
                <Target className="h-5 w-5 text-warning" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold">${metrics.avgDailyRate}</p>
              <p className="text-sm text-muted-foreground">Avg. Daily Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue vs Cost Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue vs Cost</CardTitle>
            <CardDescription>Monthly financial performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenueVsCost}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(210 10% 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(210 10% 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(160 84% 39%)" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    name="Revenue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="hsl(210 10% 60%)" 
                    fillOpacity={1} 
                    fill="url(#colorCost)" 
                    name="Cost"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Utilization Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Utilization Trend</CardTitle>
            <CardDescription>Resource utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.utilizationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    stroke="hsl(var(--muted-foreground))"
                    domain={[50, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    name="Utilization %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tier Distribution</CardTitle>
            <CardDescription>Resources by trust level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.tierDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="tier"
                    label={({ tier, count }) => `${count}`}
                  >
                    {analytics.tierDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Skills Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Skills</CardTitle>
            <CardDescription>Most common skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topSkills} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    type="category" 
                    dataKey="skill" 
                    tick={{ fontSize: 11 }} 
                    stroke="hsl(var(--muted-foreground))"
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Skills Gap Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Skills Gap
            </CardTitle>
            <CardDescription>Demand vs supply analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.skillsGap.map((item) => {
                const gap = item.demand - item.supply;
                const percentage = Math.min((item.supply / item.demand) * 100, 100);
                return (
                  <div key={item.skill}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.skill}</span>
                      <span className={cn(
                        "text-xs font-medium",
                        gap > 5 ? "text-destructive" : gap > 0 ? "text-warning" : "text-success"
                      )}>
                        {gap > 0 ? `-${gap}` : `+${Math.abs(gap)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-16">
                        {item.supply}/{item.demand}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performers</CardTitle>
            <CardDescription>Highest rated resources this quarter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockResources
                .sort((a, b) => {
                  const aRating = a.managerFeedback.reduce((acc, f) => acc + f.rating, 0) / Math.max(a.managerFeedback.length, 1);
                  const bRating = b.managerFeedback.reduce((acc, f) => acc + f.rating, 0) / Math.max(b.managerFeedback.length, 1);
                  return bRating - aRating;
                })
                .slice(0, 5)
                .map((resource, index) => {
                  const avgRating = resource.managerFeedback.reduce((acc, f) => acc + f.rating, 0) / Math.max(resource.managerFeedback.length, 1);
                  return (
                    <div key={resource.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{resource.fullName}</p>
                        <p className="text-xs text-muted-foreground">{resource.organization}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{avgRating.toFixed(1)}★</p>
                        <p className="text-xs text-muted-foreground">
                          {resource.reliabilityScore}% reliable
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Organization Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organization Breakdown</CardTitle>
            <CardDescription>Resources by organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(
                mockResources.reduce((acc, r) => {
                  acc[r.organization] = (acc[r.organization] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([org, count], index) => (
                  <div key={org} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="flex-1 text-sm">{org}</span>
                    <span className="font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground w-12">
                      {Math.round((count / mockResources.length) * 100)}%
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
