import { useState, useMemo } from 'react';
import { mockResources, getTierLabel, getAvailabilityColor } from '@/data/mockData';
import { Resource, Tier } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, Filter, Grid, List, SlidersHorizontal, X, Download, 
  MapPin, Star, Clock, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import ResourceCard, { TierBadge, AvailabilityBadge } from '@/components/resources/ResourceCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'tier' | 'availability' | 'experience';

export default function Resources() {
  const { canViewPricing } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('tier');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  
  // Filters
  const [selectedTiers, setSelectedTiers] = useState<Tier[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [minAvailability, setMinAvailability] = useState(0);

  // Get unique values for filters
  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    mockResources.forEach(r => r.skills.forEach(s => skills.add(s.name)));
    return Array.from(skills).sort();
  }, []);

  const allOrgs = useMemo(() => {
    return Array.from(new Set(mockResources.map(r => r.organization))).sort();
  }, []);

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    let filtered = mockResources.filter(resource => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = resource.fullName.toLowerCase().includes(query);
        const matchesSkill = resource.skills.some(s => s.name.toLowerCase().includes(query));
        const matchesOrg = resource.organization.toLowerCase().includes(query);
        const matchesLocation = `${resource.location.city} ${resource.location.country}`.toLowerCase().includes(query);
        if (!matchesName && !matchesSkill && !matchesOrg && !matchesLocation) return false;
      }

      // Tier filter
      if (selectedTiers.length > 0 && !selectedTiers.includes(resource.tier)) return false;

      // Skills filter
      if (selectedSkills.length > 0) {
        const hasSkill = selectedSkills.some(skill => 
          resource.skills.some(s => s.name === skill)
        );
        if (!hasSkill) return false;
      }

      // Organization filter
      if (selectedOrgs.length > 0 && !selectedOrgs.includes(resource.organization)) return false;

      // Availability filter
      if (resource.weeklyAvailability < minAvailability) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        case 'tier':
          return a.tier - b.tier;
        case 'availability':
          return b.weeklyAvailability - a.weeklyAvailability;
        case 'experience':
          return b.vggExperienceYears - a.vggExperienceYears;
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedTiers, selectedSkills, selectedOrgs, minAvailability, sortBy]);

  const activeFilterCount = [
    selectedTiers.length > 0,
    selectedSkills.length > 0,
    selectedOrgs.length > 0,
    minAvailability > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedTiers([]);
    setSelectedSkills([]);
    setSelectedOrgs([]);
    setMinAvailability(0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">
            {filteredResources.length} of {mockResources.length} resources
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and filters bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, skill, location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tier">Sort by Tier</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="availability">Sort by Availability</SelectItem>
              <SelectItem value="experience">Sort by Experience</SelectItem>
            </SelectContent>
          </Select>

          {/* Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow down your search</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Tier filter */}
                <div>
                  <Label className="text-sm font-medium">Tier</Label>
                  <div className="mt-2 space-y-2">
                    {([1, 2, 3, 4] as Tier[]).map((tier) => (
                      <div key={tier} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tier-${tier}`}
                          checked={selectedTiers.includes(tier)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTiers([...selectedTiers, tier]);
                            } else {
                              setSelectedTiers(selectedTiers.filter(t => t !== tier));
                            }
                          }}
                        />
                        <Label htmlFor={`tier-${tier}`} className="text-sm cursor-pointer">
                          Tier {tier} - {getTierLabel(tier)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Availability filter */}
                <div>
                  <Label className="text-sm font-medium">
                    Min. Availability: {minAvailability}h/week
                  </Label>
                  <Slider
                    value={[minAvailability]}
                    onValueChange={([value]) => setMinAvailability(value)}
                    max={40}
                    step={5}
                    className="mt-3"
                  />
                </div>

                {/* Skills filter */}
                <div>
                  <Label className="text-sm font-medium">Skills</Label>
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                    {allSkills.slice(0, 15).map((skill) => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={`skill-${skill}`}
                          checked={selectedSkills.includes(skill)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSkills([...selectedSkills, skill]);
                            } else {
                              setSelectedSkills(selectedSkills.filter(s => s !== skill));
                            }
                          }}
                        />
                        <Label htmlFor={`skill-${skill}`} className="text-sm cursor-pointer">
                          {skill}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Organization filter */}
                <div>
                  <Label className="text-sm font-medium">Organization</Label>
                  <div className="mt-2 space-y-2">
                    {allOrgs.map((org) => (
                      <div key={org} className="flex items-center space-x-2">
                        <Checkbox
                          id={`org-${org}`}
                          checked={selectedOrgs.includes(org)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOrgs([...selectedOrgs, org]);
                            } else {
                              setSelectedOrgs(selectedOrgs.filter(o => o !== org));
                            }
                          }}
                        />
                        <Label htmlFor={`org-${org}`} className="text-sm cursor-pointer">
                          {org}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear filters */}
                {activeFilterCount > 0 && (
                  <Button variant="outline" className="w-full" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* View toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedTiers.map(tier => (
            <Badge key={tier} variant="secondary" className="gap-1">
              Tier {tier}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedTiers(selectedTiers.filter(t => t !== tier))}
              />
            </Badge>
          ))}
          {selectedSkills.map(skill => (
            <Badge key={skill} variant="secondary" className="gap-1">
              {skill}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}
              />
            </Badge>
          ))}
          {selectedOrgs.map(org => (
            <Badge key={org} variant="secondary" className="gap-1">
              {org}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedOrgs(selectedOrgs.filter(o => o !== org))}
              />
            </Badge>
          ))}
          {minAvailability > 0 && (
            <Badge variant="secondary" className="gap-1">
              {minAvailability}h+ available
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setMinAvailability(0)}
              />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Resources grid/list */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No resources found matching your criteria.</p>
          <Button variant="link" onClick={clearFilters}>Clear filters</Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard 
              key={resource.id} 
              resource={resource} 
              onClick={() => setSelectedResource(resource)}
              showPricing
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredResources.map((resource) => (
            <Card 
              key={resource.id} 
              className="card-interactive"
              onClick={() => setSelectedResource(resource)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={resource.avatar} />
                    <AvatarFallback>{resource.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{resource.fullName}</span>
                      <TierBadge tier={resource.tier} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{resource.title}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{resource.organization}</span>
                    <span className="text-muted-foreground">{resource.location.city}</span>
                    <AvailabilityBadge hours={resource.weeklyAvailability} />
                  </div>
                  {canViewPricing('individual') && (
                    <div className="font-medium">${resource.pricing.individualDailyRate}/day</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resource detail dialog */}
      <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedResource && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedResource.avatar} />
                    <AvatarFallback className="text-lg">
                      {selectedResource.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl">{selectedResource.fullName}</DialogTitle>
                      <TierBadge tier={selectedResource.tier} />
                    </div>
                    <p className="text-muted-foreground">{selectedResource.title}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {selectedResource.organization}
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="stat-card">
                      <p className="stat-label">Availability</p>
                      <p className="stat-value text-xl">{selectedResource.weeklyAvailability}h</p>
                      <p className="text-xs text-muted-foreground">per week</p>
                    </div>
                    <div className="stat-card">
                      <p className="stat-label">VGG Experience</p>
                      <p className="stat-value text-xl">{selectedResource.vggExperienceYears}</p>
                      <p className="text-xs text-muted-foreground">years</p>
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

                  {/* Pricing */}
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">Pricing</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {canViewPricing('individual') && (
                        <div>
                          <p className="text-sm text-muted-foreground">Daily Rate</p>
                          <p className="text-lg font-semibold">${selectedResource.pricing.individualDailyRate}</p>
                        </div>
                      )}
                      {canViewPricing('release') && (
                        <div>
                          <p className="text-sm text-muted-foreground">Release Fee</p>
                          <p className="text-lg font-semibold">${selectedResource.pricing.organizationReleaseFee}</p>
                        </div>
                      )}
                      {canViewPricing('margin') && (
                        <div>
                          <p className="text-sm text-muted-foreground">GVTS Margin</p>
                          <p className="text-lg font-semibold">${selectedResource.pricing.gvtsMargin}</p>
                        </div>
                      )}
                      {canViewPricing('total') && (
                        <div>
                          <p className="text-sm text-muted-foreground">Total Billable</p>
                          <p className="text-lg font-bold text-success">${selectedResource.pricing.totalBillableRate}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">AI Bid Summary</h4>
                    <p className="text-sm text-muted-foreground">{selectedResource.aiBidReadySummary}</p>
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="mt-4">
                  <div className="space-y-2">
                    {selectedResource.skills.map((skill) => (
                      <div key={skill.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{skill.name}</span>
                          {skill.validated && (
                            <Badge variant="outline" className="text-success border-success text-xs">
                              Validated
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{skill.yearsExperience} years</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={cn(
                                  "h-3 w-3",
                                  i < skill.proficiency ? "fill-warning text-warning" : "text-muted"
                                )} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="experience" className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Delivery Examples</h4>
                    {selectedResource.deliveryExamples.map((example, i) => (
                      <div key={i} className="p-3 rounded-lg border mb-2">
                        <p className="font-medium">{example.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{example.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Client: {example.client}</span>
                          <span>Outcome: {example.outcome}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedResource.certifications.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Certifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedResource.certifications.map((cert, i) => (
                          <Badge key={i} variant="secondary">
                            {cert.name} ({cert.year})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="feedback" className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Manager Feedback</h4>
                    {selectedResource.managerFeedback.map((fb) => (
                      <div key={fb.id} className="p-3 rounded-lg border mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{fb.authorName}</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={cn(
                                  "h-3 w-3",
                                  i < fb.rating ? "fill-warning text-warning" : "text-muted"
                                )} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{fb.comments}</p>
                        <p className="text-xs text-muted-foreground mt-2">{fb.date}</p>
                      </div>
                    ))}
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
