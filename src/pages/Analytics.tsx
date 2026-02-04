import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { mockAnalyticsData, mockResources, mockOpportunities, mockProposals } from '@/data/mockData';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Target, BarChart3,
  PieChart as PieChartIcon, Activity, AlertTriangle, Globe, Building2,
  Briefcase, Clock, CheckCircle2, ArrowUpRight, ArrowDownRight, Zap,
  Calendar, Download, Filter, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(210 100% 35%)', 'hsl(16 100% 50%)', 'hsl(160 90% 32%)', 'hsl(38 95% 45%)', 'hsl(280 70% 50%)'];
const TIER_COLORS = ['hsl(45 95% 42%)', 'hsl(0 0% 55%)', 'hsl(30 55% 42%)', 'hsl(210 12% 50%)'];

export default function Analytics() {
  const { user, canViewAnalytics, canViewFinancials } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!canViewAnalytics()) {
    return <Navigate to="/dashboard" replace />;
  }

  const analytics = mockAnalyticsData;

  // Calculate additional metrics
  const metrics = useMemo(() => {
    const margin = ((analytics.totalRevenue - analytics.totalCost) / analytics.totalRevenue * 100);
    const avgDailyRate = mockResources.reduce((acc, r) => acc + r.pricing.totalBillableRate, 0) / mockResources.length;
    const benchStrength = mockResources.filter(r => r.weeklyAvailability >= 30).length;
    
    // Organization distribution
    const orgDistribution = mockResources.reduce((acc, r) => {
      acc[r.organization] = (acc[r.organization] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Location distribution
    const locationDistribution = mockResources.reduce((acc, r) => {
      acc[r.location.country] = (acc[r.location.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Experience level distribution
    const expLevelData = [
      { name: 'Junior (0-2 yrs)', value: mockResources.filter(r => r.vggExperienceYears <= 2).length },
      { name: 'Mid (3-5 yrs)', value: mockResources.filter(r => r.vggExperienceYears > 2 && r.vggExperienceYears <= 5).length },
      { name: 'Senior (6-10 yrs)', value: mockResources.filter(r => r.vggExperienceYears > 5 && r.vggExperienceYears <= 10).length },
      { name: 'Expert (10+ yrs)', value: mockResources.filter(r => r.vggExperienceYears > 10).length },
    ];

    // Monthly projections (simulated forecast)
    const projections = analytics.revenueVsCost.map((item, i) => ({
      ...item,
      projected: Math.round(item.revenue * (1 + (0.05 * (i + 1)))),
    }));

    // Client distribution from opportunities
    const clientDistribution = mockOpportunities.reduce((acc, o) => {
      acc[o.client] = (acc[o.client] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      margin: margin.toFixed(1),
      avgDailyRate: Math.round(avgDailyRate),
      benchStrength,
      utilizationChange: analytics.utilizationTrend[analytics.utilizationTrend.length - 1].rate - 
                         analytics.utilizationTrend[0].rate,
      orgDistribution: Object.entries(orgDistribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
      locationDistribution: Object.entries(locationDistribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      expLevelData,
      projections,
      clientDistribution: Object.entries(clientDistribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      totalPipelineValue: mockOpportunities
        .filter(o => o.status === 'open')
        .reduce((acc, o) => acc + (o.dailyRate * o.effortDays), 0),
      avgProfileCompleteness: Math.round(mockResources.reduce((acc, r) => acc + r.profileCompleteness, 0) / mockResources.length),
    };
  }, [analytics]);

  // Skills radar data
  const skillsRadarData = analytics.topSkills.slice(0, 8).map(s => ({
    skill: s.skill.length > 12 ? s.skill.substring(0, 10) + '...' : s.skill,
    count: s.count,
    fullMark: 30,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Platform performance and resource intelligence insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className={cn(
                "text-xs font-semibold",
                metrics.utilizationChange >= 0 ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"
              )}>
                {metrics.utilizationChange >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(metrics.utilizationChange)}%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold tracking-tight">{analytics.utilizationRate}%</p>
              <p className="text-sm text-muted-foreground mt-1">Utilization Rate</p>
            </div>
            <Progress value={analytics.utilizationRate} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/5 via-transparent to-transparent border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold bg-success/10 text-success border-success/30">
                {metrics.margin}% margin
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold tracking-tight">${(analytics.totalRevenue / 1000000).toFixed(2)}M</p>
              <p className="text-sm text-muted-foreground mt-1">Total Revenue</p>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Cost: ${(analytics.totalCost / 1000000).toFixed(2)}M</span>
              <span className="text-success font-medium">Profit: ${((analytics.totalRevenue - analytics.totalCost) / 1000000).toFixed(2)}M</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/5 via-transparent to-transparent border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-secondary/10">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {metrics.benchStrength} on bench
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold tracking-tight">{analytics.totalResources}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Resources</p>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success" />
                {analytics.availableResources} available
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-warning" />
                {analytics.totalResources - analytics.availableResources} assigned
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/5 via-transparent to-transparent border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-warning/10">
                <Briefcase className="h-5 w-5 text-warning" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold bg-warning/10 text-warning border-warning/30">
                ${(metrics.totalPipelineValue / 1000).toFixed(0)}K pipeline
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold tracking-tight">{analytics.openOpportunities}</p>
              <p className="text-sm text-muted-foreground mt-1">Open Opportunities</p>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Avg. Rate: ${metrics.avgDailyRate}/day
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background">Overview</TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-background">Resources</TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-background">Financial</TabsTrigger>
          <TabsTrigger value="skills" className="data-[state=active]:bg-background">Skills</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Charts Row 1 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue vs Cost Trend */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Revenue vs Cost Trend</CardTitle>
                    <CardDescription>Monthly financial performance with projections</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={metrics.projections}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(160 90% 32%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(160 90% 32%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                        stroke="hsl(var(--border))"
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(160 90% 32%)" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        name="Revenue"
                        strokeWidth={2}
                      />
                      <Bar dataKey="cost" fill="hsl(210 12% 50%)" name="Cost" radius={[4, 4, 0, 0]} />
                      <Line 
                        type="monotone" 
                        dataKey="projected" 
                        stroke="hsl(38 95% 45%)" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        name="Projected"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Utilization Trend */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Utilization Trend</CardTitle>
                    <CardDescription>Resource utilization over time</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{analytics.utilizationRate}%</p>
                    <p className="text-xs text-muted-foreground">Current</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.utilizationTrend}>
                      <defs>
                        <linearGradient id="utilizationGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(210 100% 35%)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(210 100% 35%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                        stroke="hsl(var(--border))"
                        domain={[50, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="hsl(210 100% 35%)"
                        strokeWidth={3}
                        fill="url(#utilizationGrad)"
                        name="Utilization %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Tier Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Tier Distribution</CardTitle>
                <CardDescription>Resources by trust level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.tierDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="tier"
                      >
                        {analytics.tierDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={TIER_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {analytics.tierDistribution.map((tier, i) => (
                    <div key={tier.tier} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TIER_COLORS[i] }} />
                      <span className="text-muted-foreground truncate">{tier.tier.split(' - ')[0]}</span>
                      <span className="font-semibold ml-auto">{tier.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Client Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Client Distribution</CardTitle>
                <CardDescription>Opportunities by client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.clientDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {metrics.clientDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 mt-2">
                  {metrics.clientDistribution.slice(0, 4).map((client, i) => (
                    <div key={client.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground truncate flex-1">{client.name}</span>
                      <span className="font-semibold">{client.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skills Gap */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <CardTitle className="text-lg font-semibold">Skills Gap</CardTitle>
                    <CardDescription>Demand vs supply</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.skillsGap.map((item) => {
                    const gap = item.demand - item.supply;
                    const percentage = Math.min((item.supply / item.demand) * 100, 100);
                    return (
                      <div key={item.skill}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.skill}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              gap > 5 ? "bg-destructive/10 text-destructive border-destructive/30" : 
                              gap > 0 ? "bg-warning/10 text-warning border-warning/30" : 
                              "bg-success/10 text-success border-success/30"
                            )}
                          >
                            {gap > 0 ? `−${gap}` : `+${Math.abs(gap)}`}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-10">
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
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Organization Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Organization Breakdown</CardTitle>
                <CardDescription>Resources by organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.orgDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                        stroke="hsl(var(--border))"
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(210 100% 35%)" radius={[0, 4, 4, 0]} name="Resources" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-semibold">Geographic Distribution</CardTitle>
                    <CardDescription>Resources by country</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.locationDistribution.map((location, index) => (
                    <div key={location.name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{location.name}</span>
                          <span className="text-sm font-semibold">{location.value}</span>
                        </div>
                        <Progress value={(location.value / analytics.totalResources) * 100} className="h-2" />
                      </div>
                      <span className="text-xs text-muted-foreground w-12">
                        {Math.round((location.value / analytics.totalResources) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Experience Level Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Experience Levels</CardTitle>
                <CardDescription>Resources by VGG experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.expLevelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {metrics.expLevelData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Top Performers</CardTitle>
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
                        <div key={resource.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white text-sm font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{resource.fullName}</p>
                            <p className="text-xs text-muted-foreground">{resource.organization}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-warning">{avgRating.toFixed(1)}★</p>
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
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          {canViewFinancials() ? (
            <>
              {/* Financial Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-success/20">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">${(analytics.totalRevenue / 1000000).toFixed(2)}M</p>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-destructive/20">
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">${(analytics.totalCost / 1000000).toFixed(2)}M</p>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/20">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">${((analytics.totalRevenue - analytics.totalCost) / 1000000).toFixed(2)}M</p>
                        <p className="text-sm text-muted-foreground">Gross Profit</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-warning/20">
                        <Target className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{metrics.margin}%</p>
                        <p className="text-sm text-muted-foreground">Profit Margin</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Monthly Revenue Breakdown</CardTitle>
                    <CardDescription>Revenue, cost, and margin analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.revenueVsCost} barGap={8}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                          <YAxis 
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                            stroke="hsl(var(--border))"
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
                          <Bar dataKey="revenue" fill="hsl(160 90% 32%)" name="Revenue" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="cost" fill="hsl(0 80% 50%)" name="Cost" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Pipeline Value</CardTitle>
                    <CardDescription>Open opportunities by client</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockOpportunities.filter(o => o.status === 'open').map((opp) => {
                        const value = opp.dailyRate * opp.effortDays;
                        const percentage = (value / metrics.totalPipelineValue) * 100;
                        return (
                          <div key={opp.id}>
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-sm font-medium truncate">{opp.title.substring(0, 35)}...</p>
                                <p className="text-xs text-muted-foreground">{opp.client}</p>
                              </div>
                              <p className="font-semibold text-success">${(value / 1000).toFixed(0)}K</p>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Financial Access Required</h3>
              <p className="text-muted-foreground">You don't have permission to view financial data.</p>
            </Card>
          )}
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Skills Radar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Skills Radar</CardTitle>
                <CardDescription>Top skills coverage analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillsRadarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="skill" 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 30]}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Radar 
                        name="Count" 
                        dataKey="count" 
                        stroke="hsl(210 100% 35%)" 
                        fill="hsl(210 100% 35%)" 
                        fillOpacity={0.4}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Skills Bar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Top Skills Distribution</CardTitle>
                <CardDescription>Most common skills in pool</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.topSkills.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                      <YAxis 
                        type="category" 
                        dataKey="skill" 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                        stroke="hsl(var(--border))"
                        width={120}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(210 100% 35%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills Gap Analysis */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <CardTitle className="text-lg font-semibold">Skills Gap Analysis</CardTitle>
                  <CardDescription>Detailed demand vs supply comparison</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {analytics.skillsGap.map((item) => {
                  const gap = item.demand - item.supply;
                  const percentage = Math.min((item.supply / item.demand) * 100, 100);
                  return (
                    <div key={item.skill} className={cn(
                      "p-4 rounded-xl border",
                      gap > 5 ? "bg-destructive/5 border-destructive/20" :
                      gap > 0 ? "bg-warning/5 border-warning/20" :
                      "bg-success/5 border-success/20"
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">{item.skill}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            gap > 5 ? "bg-destructive/10 text-destructive border-destructive/30" : 
                            gap > 0 ? "bg-warning/10 text-warning border-warning/30" : 
                            "bg-success/10 text-success border-success/30"
                          )}
                        >
                          {gap > 0 ? `−${gap}` : `+${Math.abs(gap)}`}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Supply</span>
                          <span className="font-medium">{item.supply}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Demand</span>
                          <span className="font-medium">{item.demand}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground">{Math.round(percentage)}% filled</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
