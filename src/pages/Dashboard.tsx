import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { mockResources, mockOpportunities, mockAnalyticsData } from '@/data/mockData';
import { 
  Users, Briefcase, TrendingUp, DollarSign, Target, BarChart3,
  ArrowRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ResourceCard from '@/components/resources/ResourceCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const COLORS = ['hsl(45 93% 47%)', 'hsl(0 0% 70%)', 'hsl(30 50% 50%)', 'hsl(210 10% 60%)'];

export default function Dashboard() {
  const { user, canViewAnalytics } = useAuth();
  const analytics = mockAnalyticsData;

  const availableResources = useMemo(() => 
    mockResources.filter(r => r.weeklyAvailability >= 20).slice(0, 4),
    []
  );

  const openOpportunities = useMemo(() =>
    mockOpportunities.filter(o => o.status === 'open').slice(0, 3),
    []
  );

  const stats = [
    {
      title: 'Total Resources',
      value: analytics.totalResources,
      icon: Users,
      change: '+5',
      positive: true,
      href: '/resources',
    },
    {
      title: 'Available Now',
      value: analytics.availableResources,
      icon: Target,
      change: `${Math.round((analytics.availableResources / analytics.totalResources) * 100)}%`,
      positive: true,
    },
    {
      title: 'Open Opportunities',
      value: analytics.openOpportunities,
      icon: Briefcase,
      change: '+2',
      positive: true,
      href: '/opportunities',
    },
    {
      title: 'Utilization Rate',
      value: `${analytics.utilizationRate}%`,
      icon: TrendingUp,
      change: '+3%',
      positive: true,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your resources today.
          </p>
        </div>
        <Button asChild>
          <Link to="/team-builder">
            <Target className="mr-2 h-4 w-4" />
            Build Team
          </Link>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.positive ? 'text-success' : 'text-destructive'
                }`}>
                  {stat.positive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
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

      {/* Charts row - Admin only */}
      {canViewAnalytics() && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Utilization Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Utilization Trend</CardTitle>
              <CardDescription>Resource utilization over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.utilizationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                      domain={[0, 100]}
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
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue vs Cost */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue vs Cost</CardTitle>
              <CardDescription>Financial performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.revenueVsCost}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
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
                    <Bar dataKey="revenue" fill="hsl(var(--success))" name="Revenue" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" fill="hsl(var(--muted-foreground))" name="Cost" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tier Distribution & Top Skills */}
      {canViewAnalytics() && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tier Distribution</CardTitle>
              <CardDescription>Resources by trust level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.tierDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="tier"
                      label={({ tier, count }) => `${count}`}
                    >
                      {analytics.tierDistribution.map((_, index) => (
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Skills</CardTitle>
              <CardDescription>Most common skills in the pool</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topSkills.slice(0, 5).map((skill, index) => (
                  <div key={skill.skill} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-4">{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{skill.skill}</span>
                        <span className="text-sm text-muted-foreground">{skill.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
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
        {/* Available Resources */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Available Resources</CardTitle>
              <CardDescription>Ready to deploy</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
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

        {/* Open Opportunities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Open Opportunities</CardTitle>
              <CardDescription>Active positions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/opportunities">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {openOpportunities.map((opp) => (
              <div key={opp.id} className="p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{opp.title}</h4>
                    <p className="text-xs text-muted-foreground">{opp.client}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {opp.applicants.length} applicants
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {opp.requiredSkills.slice(0, 3).map((skill) => (
                    <span key={skill} className="skill-pill text-xs py-0.5">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
