import { useState, useMemo } from 'react';
import { mockOpportunities, mockResources, getExperienceLevelLabel } from '@/data/mockData';
import { Opportunity, OpportunityStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search, Filter, Plus, MapPin, Calendar, Clock, Users, DollarSign,
  Briefcase, ChevronRight, CheckCircle, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusColors: Record<OpportunityStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  open: 'bg-success/15 text-success',
  filled: 'bg-primary/15 text-primary',
  closed: 'bg-muted text-muted-foreground',
};

export default function Opportunities() {
  const { user, canCreateOpportunities, canViewPricing } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | 'all'>('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Filter opportunities
  const filteredOpportunities = useMemo(() => {
    return mockOpportunities.filter(opp => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = opp.title.toLowerCase().includes(query) ||
          opp.client.toLowerCase().includes(query) ||
          opp.requiredSkills.some(s => s.toLowerCase().includes(query));
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && opp.status !== statusFilter) return false;
      return true;
    });
  }, [searchQuery, statusFilter]);

  const handleExpressInterest = (opp: Opportunity) => {
    toast({
      title: 'Interest submitted',
      description: `You've expressed interest in "${opp.title}"`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground">
            Browse and apply to open positions
          </p>
        </div>
        {canCreateOpportunities() && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Opportunity</DialogTitle>
                <DialogDescription>
                  Define a new position for resource deployment
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input placeholder="e.g., Senior Data Analyst" />
                  </div>
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Input placeholder="e.g., World Bank" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Describe the role and responsibilities..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Required Skills (comma-separated)</Label>
                  <Input placeholder="e.g., Python, SQL, Data Analysis" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Experience Level</Label>
                    <Select defaultValue="mid">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="mid">Mid-level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input placeholder="e.g., Lagos, Remote" />
                  </div>
                  <div className="space-y-2">
                    <Label>Daily Rate ($)</Label>
                    <Input type="number" placeholder="e.g., 800" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Effort (days)</Label>
                    <Input type="number" placeholder="e.g., 60" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({ title: 'Opportunity created', description: 'The opportunity has been published.' });
                  setShowCreateDialog(false);
                }}>
                  Create Opportunity
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OpportunityStatus | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Briefcase className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockOpportunities.filter(o => o.status === 'open').length}</p>
                <p className="text-sm text-muted-foreground">Open Positions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockOpportunities.reduce((acc, o) => acc + o.applicants.length, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Applicants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <CheckCircle className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockOpportunities.filter(o => o.status === 'filled').length}</p>
                <p className="text-sm text-muted-foreground">Filled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(mockOpportunities.reduce((acc, o) => acc + o.effortDays, 0) / mockOpportunities.length)}</p>
                <p className="text-sm text-muted-foreground">Avg. Duration (days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOpportunities.map((opp) => (
          <Card key={opp.id} className="card-interactive" onClick={() => setSelectedOpportunity(opp)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Badge className={cn('text-xs', statusColors[opp.status])}>
                  {opp.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {opp.applicants.length} applicants
                </span>
              </div>
              <CardTitle className="text-base mt-2">{opp.title}</CardTitle>
              <CardDescription>{opp.client}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {opp.description}
              </p>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-4">
                {opp.requiredSkills.slice(0, 3).map((skill) => (
                  <span key={skill} className="skill-pill text-xs py-0.5">
                    {skill}
                  </span>
                ))}
                {opp.requiredSkills.length > 3 && (
                  <span className="skill-pill text-xs py-0.5 bg-muted">
                    +{opp.requiredSkills.length - 3}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {opp.location}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {opp.effortDays} days
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(opp.startDate).toLocaleDateString()}
                </div>
                {canViewPricing('total') && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${opp.dailyRate}/day
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No opportunities found matching your criteria.</p>
        </div>
      )}

      {/* Opportunity detail dialog */}
      <Dialog open={!!selectedOpportunity} onOpenChange={(open) => !open && setSelectedOpportunity(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOpportunity && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={cn('text-xs', statusColors[selectedOpportunity.status])}>
                    {selectedOpportunity.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Posted {new Date(selectedOpportunity.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <DialogTitle>{selectedOpportunity.title}</DialogTitle>
                <DialogDescription>{selectedOpportunity.client}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="mt-4">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  {canCreateOpportunities() && (
                    <TabsTrigger value="applicants">
                      Applicants ({selectedOpportunity.applicants.length})
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedOpportunity.description}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedOpportunity.requiredSkills.map((skill) => (
                        <span key={skill} className="skill-pill">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="stat-card">
                      <p className="stat-label">Experience</p>
                      <p className="font-medium">{getExperienceLevelLabel(selectedOpportunity.experienceLevel)}</p>
                    </div>
                    <div className="stat-card">
                      <p className="stat-label">Duration</p>
                      <p className="font-medium">{selectedOpportunity.effortDays} days</p>
                    </div>
                    <div className="stat-card">
                      <p className="stat-label">Location</p>
                      <p className="font-medium">{selectedOpportunity.location}</p>
                    </div>
                    {canViewPricing('total') && (
                      <div className="stat-card">
                        <p className="stat-label">Daily Rate</p>
                        <p className="font-medium">${selectedOpportunity.dailyRate}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{new Date(selectedOpportunity.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">{new Date(selectedOpportunity.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {selectedOpportunity.status === 'open' && user?.role === 'professional' && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleExpressInterest(selectedOpportunity)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Express Interest
                    </Button>
                  )}
                </TabsContent>

                {canCreateOpportunities() && (
                  <TabsContent value="applicants" className="mt-4">
                    {selectedOpportunity.applicants.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No applicants yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedOpportunity.applicants.map((applicant) => {
                          const resource = mockResources.find(r => r.id === applicant.resourceId);
                          if (!resource) return null;
                          
                          return (
                            <div key={applicant.resourceId} className="flex items-center gap-3 p-3 rounded-lg border">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={resource.avatar} />
                                <AvatarFallback>
                                  {resource.fullName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{resource.fullName}</p>
                                <p className="text-sm text-muted-foreground">{resource.organization}</p>
                              </div>
                              <Badge variant={
                                applicant.status === 'selected' ? 'default' :
                                applicant.status === 'shortlisted' ? 'secondary' : 'outline'
                              }>
                                {applicant.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(applicant.appliedAt).toLocaleDateString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
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
