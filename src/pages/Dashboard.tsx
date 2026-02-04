import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { mockResources, mockOpportunities, mockAnalyticsData, mockProposals, mockAssignments } from '@/data/mockData';
import { 
  Users, Briefcase, TrendingUp, DollarSign, Target, BarChart3,
  ArrowRight, ArrowUpRight, ArrowDownRight, Activity, Clock, CheckCircle2,
  AlertTriangle, Sparkles, Globe, Building2, Calendar, Zap, PieChart as PieChartIcon,
  FileText, UserCheck, Layers
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ResourceCard from '@/components/resources/ResourceCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import { cn } from '@/lib/utils';

const TIER_COLORS = ['hsl(45 95% 42%)', 'hsl(0 0% 55%)', 'hsl(30 55% 42%)', 'hsl(210 12% 50%)'];
const CHART_COLORS = ['hsl(210 100% 35%)', 'hsl(16 100% 50%)', 'hsl(160 90% 32%)', 'hsl(38 95% 45%)'];

export default function Dashboard() {
  const { user, canViewAnalytics, canViewFinancials } = useAuth();
  const analytics = mockAnalyticsData;

  const availableResources = useMemo(() => 
    mockResources.filter(r => r.weeklyAvailability >= 20).slice(0, 3),
    []
  );

  const openOpportunities = useMemo(() =>
    mockOpportunities.filter(o => o.status === 'open').slice(0, 3),
    []
  );

  // Calculate extended metrics
  const extendedMetrics = useMemo(() => {
    const totalPipelineValue = mockOpportunities
      .filter(o => o.status === 'open')
      .reduce((acc, o) => acc + (o.dailyRate * o.effortDays), 0);
    
    const avgMatchScore = mockResources.reduce((acc, r) => acc + r.reliabilityScore, 0) / mockResources.length;
    
    const tier1Count = mockResources.filter(r => r.tier === 1).length;
    const tier2Count = mockResources.filter(r => r.tier === 2).length;
    
    const activeProposals = mockProposals.filter(p => p.status === 'in_progress').length;
    
    const skillsInDemand = analytics.skillsGap.filter(s => s.demand > s.supply).length;

    // Location distribution
    const locationData = mockResources.reduce((acc, r) => {
      const country = r.location.country;
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPipelineValue,
      avgMatchScore: Math.round(avgMatchScore),
      tier1Count,
      tier2Count,
      premiumResources: tier1Count + tier2Count,
      activeProposals,
      skillsInDemand,
      locationData: Object.entries(locationData)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    };
  }, [analytics]);

  // Activity feed data
  const activityFeed = [
    { id: 1, type: 'assignment', message: 'New resource assigned to World Bank project', time: '2 hours ago', icon: UserCheck },
    { id: 2, type: 'opportunity', message: 'GIZ opportunity received 3 new applications', time: '4 hours ago', icon: Briefcase },
    { id: 3, type: 'milestone', message: 'Q4 utilization target achieved', time: '1 day ago', icon: CheckCircle2 },
    { id: 4, type: 'alert', message: 'Skills gap identified in ML Engineering', time: '2 days ago', icon: AlertTriangle },
  ];

  const primaryStats = [
    {
      title: 'Total Resources',
      value: analytics.totalResources,
      icon: Users,
      change: '+5',
      positive: true,
      color: 'bg-primary/10 text-primary',
      href: '/resources',
    },
    {
      title: 'Utilization Rate',
      value: `${analytics.utilizationRate}%`,
      icon: Activity,
      change: '+3%',
      positive: true,
      color: 'bg-success/10 text-success',
    },
    {
      title: 'Open Opportunities',
      value: analytics.openOpportunities,
      icon: Briefcase,
      change: '+2',
      positive: true,
      color: 'bg-secondary/10 text-secondary',
      href: '/opportunities',
    },
    {
      title: 'Pipeline Value',
      value: `$${(extendedMetrics.totalPipelineValue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      change: '+12%',
      positive: true,
      color: 'bg-warning/10 text-warning',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with gradient accent */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            Here's your resource intelligence overview for today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/reports">
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button asChild className="gradient-primary text-white">
            <Link to="/team-builder">
              <Sparkles className="mr-2 h-4 w-4" />
              Build Team
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden group hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn("p-2.5 rounded-xl", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                  stat.positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                )}>
                  {stat.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </div>
              {stat.href && (
                <Link 
                  to={stat.href}
                  className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                >
                  <span className="sr-only">View {stat.title}</span>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Metrics Row - Admin/Manager only */}
      {canViewAnalytics() && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{extendedMetrics.premiumResources}</p>
                  <p className="text-xs text-muted-foreground">Tier 1 & 2 Resources</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/20">
                  <Target className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{extendedMetrics.avgMatchScore}%</p>
                  <p className="text-xs text-muted-foreground">Avg. Quality Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{extendedMetrics.skillsInDemand}</p>
                  <p className="text-xs text-muted-foreground">Skills Gaps</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/20">
                  <FileText className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{extendedMetrics.activeProposals}</p>
                  <p className="text-xs text-muted-foreground">Active Proposals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row - Admin only */}
      {canViewAnalytics() && (
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Utilization Trend - Larger */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Utilization Trend</CardTitle>
                  <CardDescription>Resource utilization over time</CardDescription>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +7% this quarter
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.utilizationTrend}>
                    <defs>
                      <linearGradient id="utilizationGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(210 100% 35%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(210 100% 35%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      stroke="hsl(var(--border))"
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      stroke="hsl(var(--border))"
                      domain={[50, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="hsl(210 100% 35%)"
                      strokeWidth={3}
                      fill="url(#utilizationGradient)"
                      name="Utilization %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tier Distribution */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Resource Tiers</CardTitle>
              <CardDescription>Distribution by trust level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.tierDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
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
                  <div key={tier.tier} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TIER_COLORS[i] }} />
                    <span className="text-muted-foreground truncate">{tier.tier.replace(' - ', ': ')}</span>
                    <span className="font-semibold ml-auto">{tier.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Overview - Admin with financial access */}
      {canViewFinancials() && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Revenue vs Cost</CardTitle>
                  <CardDescription>Monthly financial performance</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-success">${(analytics.totalRevenue / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-muted-foreground">Total Revenue YTD</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.revenueVsCost} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      stroke="hsl(var(--border))"
                    />
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
                    <Bar dataKey="cost" fill="hsl(210 12% 50%)" name="Cost" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                  <CardDescription>Latest platform updates</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityFeed.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={cn(
                      "p-2 rounded-lg",
                      activity.type === 'assignment' && "bg-success/10 text-success",
                      activity.type === 'opportunity' && "bg-primary/10 text-primary",
                      activity.type === 'milestone' && "bg-secondary/10 text-secondary",
                      activity.type === 'alert' && "bg-warning/10 text-warning",
                    )}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Skills Gap & Top Skills */}
      {canViewAnalytics() && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <CardTitle className="text-lg font-semibold">Skills Gap Analysis</CardTitle>
                  <CardDescription>Demand vs available supply</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.skillsGap.map((item) => {
                  const gap = item.demand - item.supply;
                  const percentage = Math.min((item.supply / item.demand) * 100, 100);
                  return (
                    <div key={item.skill}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{item.skill}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {item.supply} / {item.demand}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              gap > 5 ? "border-destructive/50 text-destructive bg-destructive/10" : 
                              gap > 0 ? "border-warning/50 text-warning bg-warning/10" : 
                              "border-success/50 text-success bg-success/10"
                            )}
                          >
                            {gap > 0 ? `−${gap}` : `+${Math.abs(gap)}`}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Top Skills in Pool</CardTitle>
              <CardDescription>Most common expertise areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topSkills.slice(0, 6).map((skill, index) => (
                  <div key={skill.skill} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{skill.skill}</span>
                        <span className="text-sm font-semibold">{skill.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                          style={{ width: `${(skill.count / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Available Resources & Open Opportunities */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Available Resources</CardTitle>
              <CardDescription>Ready to deploy</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/resources">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} compact />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Open Opportunities</CardTitle>
              <CardDescription>Active positions</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/opportunities">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {openOpportunities.map((opp) => (
              <div key={opp.id} className="p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{opp.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{opp.client}</p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-primary/5">
                    {opp.applicants.length} applicants
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {opp.requiredSkills.slice(0, 3).map((skill) => (
                    <span key={skill} className="skill-pill text-xs">
                      {skill}
                    </span>
                  ))}
                  {opp.requiredSkills.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{opp.requiredSkills.length - 3}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(opp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-success">
                    <DollarSign className="h-3 w-3" />
                    {opp.dailyRate}/day
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
