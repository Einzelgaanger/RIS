import { useMemo, useState } from 'react';
import { Building2, Download, Grid, List, MapPin, Search, Star } from 'lucide-react';

import { useResourcesQuery } from '@/hooks/use-backend-data';
import { useAuth } from '@/contexts/AuthContext';
import { Resource, Tier } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import ResourceCard, { AvailabilityBadge, TierBadge } from '@/components/resources/ResourceCard';

type ViewMode = 'grid' | 'list';

export default function Resources() {
  const { canViewPricing } = useAuth();
  const { data: resources = [], isLoading } = useResourcesQuery();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedTier, setSelectedTier] = useState<'all' | Tier>('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        resource.fullName.toLowerCase().includes(query) ||
        resource.organization.toLowerCase().includes(query) ||
        resource.skills.some((skill) => skill.name.toLowerCase().includes(query)) ||
        `${resource.location.city} ${resource.location.country}`.toLowerCase().includes(query);
      const matchesTier = selectedTier === 'all' || resource.tier === selectedTier;
      return matchesSearch && matchesTier;
    });
  }, [resources, searchQuery, selectedTier]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">{filteredResources.length} live resource profiles</p>
        </div>
        <Button variant="outline" disabled>
          <Download className="mr-2 h-4 w-4" />
          Export coming soon
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name, skill, or location..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 1, 2, 3, 4] as const).map((tier) => (
            <Button
              key={String(tier)}
              variant={selectedTier === tier ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTier(tier)}
            >
              {tier === 'all' ? 'All tiers' : `Tier ${tier}`}
            </Button>
          ))}
        </div>
        <div className="flex items-center rounded-lg border">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="rounded-r-none" onClick={() => setViewMode('grid')}>
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="rounded-l-none" onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">No resources match your current filters.</CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onClick={() => setSelectedResource(resource)} showPricing />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="card-interactive" onClick={() => setSelectedResource(resource)}>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={resource.avatar} />
                  <AvatarFallback>{resource.fullName.split(' ').map((name) => name[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{resource.fullName}</span>
                    <TierBadge tier={resource.tier} />
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{resource.title || resource.organization}</p>
                </div>
                <div className="hidden items-center gap-4 text-sm sm:flex">
                  <span className="text-muted-foreground">{resource.organization}</span>
                  <AvailabilityBadge hours={resource.weeklyAvailability} />
                </div>
                {canViewPricing('individual') && <span className="font-medium">${resource.pricing.individualDailyRate}/day</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedResource && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedResource.avatar} />
                    <AvatarFallback className="text-lg">{selectedResource.fullName.split(' ').map((name) => name[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <DialogTitle>{selectedResource.fullName}</DialogTitle>
                      <TierBadge tier={selectedResource.tier} />
                    </div>
                    <p className="text-muted-foreground">{selectedResource.title || 'No title yet'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {selectedResource.organization || 'Organization not set'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedResource.location.city}, {selectedResource.location.country}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="stat-card">
                      <p className="stat-label">Availability</p>
                      <p className="stat-value text-xl">{selectedResource.weeklyAvailability}h</p>
                    </div>
                    <div className="stat-card">
                      <p className="stat-label">Experience</p>
                      <p className="stat-value text-xl">{selectedResource.vggExperienceYears}y</p>
                    </div>
                    <div className="stat-card">
                      <p className="stat-label">Reliability</p>
                      <p className="stat-value text-xl">{selectedResource.reliabilityScore}%</p>
                    </div>
                    <div className="stat-card">
                      <p className="stat-label">Quality</p>
                      <p className="stat-value text-xl">{selectedResource.qualityScore}%</p>
                    </div>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium">Summary</p>
                    <p className="mt-2 text-sm text-muted-foreground">{selectedResource.aiBidReadySummary || 'No summary has been saved for this profile yet.'}</p>
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="mt-4 space-y-3">
                  {selectedResource.skills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No skills have been added yet.</p>
                  ) : (
                    selectedResource.skills.map((skill) => (
                      <div key={skill.name} className="flex items-center justify-between rounded-xl border p-3">
                        <div>
                          <p className="font-medium">{skill.name}</p>
                          <p className="text-sm text-muted-foreground">{skill.yearsExperience} years experience</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star key={index} className={index < skill.proficiency ? 'h-3 w-3 fill-warning text-warning' : 'h-3 w-3 text-muted'} />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="pricing" className="mt-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {canViewPricing('individual') && (
                      <div className="rounded-xl border p-4">
                        <p className="text-sm text-muted-foreground">Daily rate</p>
                        <p className="mt-2 text-xl font-bold">${selectedResource.pricing.individualDailyRate}</p>
                      </div>
                    )}
                    {canViewPricing('release') && (
                      <div className="rounded-xl border p-4">
                        <p className="text-sm text-muted-foreground">Release fee</p>
                        <p className="mt-2 text-xl font-bold">${selectedResource.pricing.organizationReleaseFee}</p>
                      </div>
                    )}
                    {canViewPricing('margin') && (
                      <div className="rounded-xl border p-4">
                        <p className="text-sm text-muted-foreground">GVTS margin</p>
                        <p className="mt-2 text-xl font-bold">${selectedResource.pricing.gvtsMargin}</p>
                      </div>
                    )}
                    {canViewPricing('total') && (
                      <div className="rounded-xl border p-4">
                        <p className="text-sm text-muted-foreground">Total billable</p>
                        <p className="mt-2 text-xl font-bold">${selectedResource.pricing.totalBillableRate}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
