import { useState, useMemo } from 'react';
import { mockResources, mockProposals, getProficiencyLabel, getTierLabel } from '@/data/mockData';
import { Resource, RoleRequirement, Proposal, TeamMember, ExperienceLevel } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Upload, FileText, Sparkles, Users, CheckCircle, ChevronRight, ChevronDown,
  Plus, Trash2, Edit, Target, DollarSign, AlertTriangle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { TierBadge } from '@/components/resources/ResourceCard';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type Step = 'upload' | 'requirements' | 'suggestions';

// Simulated AI ranking algorithm
function calculateMatchScore(resource: Resource, requirement: RoleRequirement): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Skill relevance (40%)
  const matchingSkills = resource.skills.filter(s => 
    requirement.requiredSkills.some(rs => s.name.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(s.name.toLowerCase()))
  );
  const skillScore = Math.min((matchingSkills.length / requirement.requiredSkills.length) * 40, 40);
  score += skillScore;
  if (matchingSkills.length > 0) {
    reasons.push(`${matchingSkills.length} matching skills: ${matchingSkills.slice(0, 3).map(s => s.name).join(', ')}`);
  }

  // Experience depth (20%)
  const avgExperience = resource.skills.reduce((acc, s) => acc + s.yearsExperience, 0) / resource.skills.length;
  const expLevelYears: Record<ExperienceLevel, number> = { junior: 2, mid: 5, senior: 8, expert: 12 };
  const requiredYears = expLevelYears[requirement.experienceLevel];
  const expScore = Math.min((avgExperience / requiredYears) * 20, 20);
  score += expScore;
  if (avgExperience >= requiredYears) {
    reasons.push(`${Math.round(avgExperience)} years average experience`);
  }

  // Tier weighting (15%)
  const tierScores: Record<number, number> = { 1: 15, 2: 12, 3: 8, 4: 4 };
  score += tierScores[resource.tier] || 0;
  if (resource.tier <= 2) {
    reasons.push(`Tier ${resource.tier} - ${getTierLabel(resource.tier)}`);
  }

  // Performance history (15%)
  const avgRating = [...resource.managerFeedback, ...resource.clientFeedback].reduce((acc, f) => acc + f.rating, 0) /
    Math.max([...resource.managerFeedback, ...resource.clientFeedback].length, 1);
  const perfScore = (avgRating / 5) * 15;
  score += perfScore;
  if (avgRating >= 4) {
    reasons.push(`${avgRating.toFixed(1)}★ average rating`);
  }

  // Availability (10%)
  const availScore = Math.min((resource.weeklyAvailability / 40) * 10, 10);
  score += availScore;
  if (resource.weeklyAvailability >= 30) {
    reasons.push(`${resource.weeklyAvailability}h/week available`);
  }

  return { score: Math.round(score), reasons };
}

export default function TeamBuilder() {
  const { user, canUploadProposals, canViewPricing } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form state
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalClient, setProposalClient] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [requirements, setRequirements] = useState<RoleRequirement[]>([]);
  const [teamSuggestions, setTeamSuggestions] = useState<Map<string, TeamMember[]>>(new Map());
  const [selectedTeam, setSelectedTeam] = useState<Map<string, TeamMember>>(new Map());

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Simulate document upload and parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock extracted requirements
    const mockExtracted: RoleRequirement[] = [
      {
        id: generateId(),
        roleName: 'Team Lead / Senior Consultant',
        requiredSkills: ['Strategic Advisory', 'Project Management', 'Stakeholder Management'],
        experienceLevel: 'expert',
        effortDays: 60,
        startDate: '2025-03-01',
        endDate: '2025-08-31',
      },
      {
        id: generateId(),
        roleName: 'Data Analyst',
        requiredSkills: ['Data Analysis', 'Python', 'SQL', 'Tableau'],
        experienceLevel: 'senior',
        effortDays: 90,
        startDate: '2025-03-01',
        endDate: '2025-08-31',
      },
      {
        id: generateId(),
        roleName: 'Research Associate',
        requiredSkills: ['Research', 'Data Collection', 'Report Writing'],
        experienceLevel: 'mid',
        effortDays: 120,
        startDate: '2025-03-01',
        endDate: '2025-08-31',
      },
    ];

    setProposalTitle(file.name.replace(/\.[^/.]+$/, ''));
    setRequirements(mockExtracted);
    setIsProcessing(false);
    setStep('requirements');
    
    toast({
      title: 'Document processed',
      description: `Extracted ${mockExtracted.length} role requirements`,
    });
  };

  // Add new requirement manually
  const addRequirement = () => {
    setRequirements([...requirements, {
      id: generateId(),
      roleName: '',
      requiredSkills: [],
      experienceLevel: 'mid',
      effortDays: 30,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }]);
  };

  // Remove requirement
  const removeRequirement = (id: string) => {
    setRequirements(requirements.filter(r => r.id !== id));
  };

  // Update requirement
  const updateRequirement = (id: string, updates: Partial<RoleRequirement>) => {
    setRequirements(requirements.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  // Generate team suggestions
  const generateSuggestions = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const suggestions = new Map<string, TeamMember[]>();
    const initialSelected = new Map<string, TeamMember>();

    requirements.forEach(req => {
      const scored = mockResources
        .map(resource => {
          const { score, reasons } = calculateMatchScore(resource, req);
          return {
            resourceId: resource.id,
            resource,
            roleName: req.roleName,
            matchScore: score,
            matchReasons: reasons,
            dailyRate: resource.pricing.totalBillableRate,
            totalCost: resource.pricing.totalBillableRate * req.effortDays,
            selected: false,
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      suggestions.set(req.id, scored);
      
      // Auto-select top match
      if (scored.length > 0) {
        initialSelected.set(req.id, { ...scored[0], selected: true });
      }
    });

    setTeamSuggestions(suggestions);
    setSelectedTeam(initialSelected);
    setIsProcessing(false);
    setStep('suggestions');

    toast({
      title: 'Team suggestions generated',
      description: 'AI has matched resources to your requirements',
    });
  };

  // Select a team member
  const selectTeamMember = (reqId: string, member: TeamMember) => {
    setSelectedTeam(new Map(selectedTeam).set(reqId, { ...member, selected: true }));
  };

  // Calculate totals
  const totalCost = useMemo(() => {
    return Array.from(selectedTeam.values()).reduce((acc, m) => acc + m.totalCost, 0);
  }, [selectedTeam]);

  const avgMatchScore = useMemo(() => {
    const members = Array.from(selectedTeam.values());
    if (members.length === 0) return 0;
    return Math.round(members.reduce((acc, m) => acc + m.matchScore, 0) / members.length);
  }, [selectedTeam]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Team Builder</h1>
        <p className="text-muted-foreground">
          Upload a proposal or ToR to automatically generate optimal team suggestions
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-4">
        {(['upload', 'requirements', 'suggestions'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
              step === s ? "bg-primary text-primary-foreground" :
              ['requirements', 'suggestions'].indexOf(step) > ['upload', 'requirements', 'suggestions'].indexOf(s) 
                ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
            )}>
              {['requirements', 'suggestions'].indexOf(step) > ['upload', 'requirements', 'suggestions'].indexOf(s) ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                i + 1
              )}
            </div>
            <span className={cn(
              "text-sm font-medium capitalize hidden sm:inline",
              step === s ? "text-primary" : "text-muted-foreground"
            )}>
              {s}
            </span>
            {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* File upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Document
              </CardTitle>
              <CardDescription>
                Upload a Terms of Reference (ToR) or proposal document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop or click to upload
                </p>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="max-w-xs mx-auto"
                  disabled={isProcessing}
                />
                {isProcessing && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processing document with AI...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual entry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Manual Entry
              </CardTitle>
              <CardDescription>
                Or enter requirements manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Proposal Title</Label>
                <Input 
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="e.g., Digital Financial Services Assessment"
                />
              </div>
              <div className="space-y-2">
                <Label>Client</Label>
                <Input 
                  value={proposalClient}
                  onChange={(e) => setProposalClient(e.target.value)}
                  placeholder="e.g., World Bank"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  placeholder="Brief description of the project..."
                  rows={3}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => setStep('requirements')}
                disabled={!proposalTitle}
              >
                Continue to Requirements
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent proposals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Recent Proposals</CardTitle>
              <CardDescription>Continue working on a saved proposal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mockProposals.slice(0, 3).map((proposal) => (
                  <button
                    key={proposal.id}
                    className="p-4 text-left rounded-lg border hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      setProposalTitle(proposal.title);
                      setProposalClient(proposal.client);
                      setRequirements(proposal.extractedRequirements);
                      setStep('requirements');
                    }}
                  >
                    <p className="font-medium truncate">{proposal.title}</p>
                    <p className="text-sm text-muted-foreground">{proposal.client}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {proposal.extractedRequirements.length} roles
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Requirements */}
      {step === 'requirements' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{proposalTitle || 'New Proposal'}</CardTitle>
                <CardDescription>
                  Define the roles and requirements for your team
                </CardDescription>
              </div>
              <Button onClick={addRequirement} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {requirements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No roles defined yet. Click "Add Role" to get started.</p>
                </div>
              ) : (
                requirements.map((req, index) => (
                  <div key={req.id} className="p-4 rounded-lg border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Role {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeRequirement(req.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Role Name</Label>
                        <Input
                          value={req.roleName}
                          onChange={(e) => updateRequirement(req.id, { roleName: e.target.value })}
                          placeholder="e.g., Senior Data Analyst"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Experience Level</Label>
                        <Select
                          value={req.experienceLevel}
                          onValueChange={(v) => updateRequirement(req.id, { experienceLevel: v as ExperienceLevel })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                            <SelectItem value="mid">Mid-level (3-6 years)</SelectItem>
                            <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                            <SelectItem value="expert">Expert (10+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Required Skills (comma-separated)</Label>
                      <Input
                        value={req.requiredSkills.join(', ')}
                        onChange={(e) => updateRequirement(req.id, { 
                          requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        placeholder="e.g., Python, SQL, Data Analysis"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Effort (days)</Label>
                        <Input
                          type="number"
                          value={req.effortDays}
                          onChange={(e) => updateRequirement(req.id, { effortDays: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={req.startDate}
                          onChange={(e) => updateRequirement(req.id, { startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={req.endDate}
                          onChange={(e) => updateRequirement(req.id, { endDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button 
              onClick={generateSuggestions}
              disabled={requirements.length === 0 || requirements.some(r => !r.roleName) || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Team Suggestions
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Suggestions */}
      {step === 'suggestions' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main suggestions */}
          <div className="lg:col-span-2 space-y-4">
            {requirements.map((req) => {
              const suggestions = teamSuggestions.get(req.id) || [];
              const selected = selectedTeam.get(req.id);

              return (
                <Collapsible key={req.id} defaultOpen>
                  <Card>
                    <CardHeader className="pb-3">
                      <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <div className="text-left">
                          <CardTitle className="text-base">{req.roleName}</CardTitle>
                          <CardDescription>
                            {req.experienceLevel} • {req.effortDays} days • {req.requiredSkills.slice(0, 3).join(', ')}
                          </CardDescription>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-3">
                        {suggestions.map((member, index) => (
                          <div
                            key={member.resourceId}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all",
                              selected?.resourceId === member.resourceId
                                ? "border-primary bg-primary/5"
                                : "hover:bg-accent/50"
                            )}
                            onClick={() => selectTeamMember(req.id, member)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Match score */}
                              <div className={cn(
                                "match-score flex-shrink-0",
                                member.matchScore >= 70 ? "match-score-high" :
                                member.matchScore >= 50 ? "match-score-medium" : "match-score-low"
                              )}>
                                {member.matchScore}
                              </div>

                              {/* Resource info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.resource.avatar} />
                                    <AvatarFallback>
                                      {member.resource.fullName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{member.resource.fullName}</p>
                                    <p className="text-xs text-muted-foreground">{member.resource.organization}</p>
                                  </div>
                                  <TierBadge tier={member.resource.tier} />
                                </div>

                                {/* Match reasons */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {member.matchReasons.slice(0, 3).map((reason, i) => (
                                    <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Pricing */}
                              {canViewPricing('total') && (
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-semibold">${member.dailyRate}/day</p>
                                  <p className="text-xs text-muted-foreground">${member.totalCost.toLocaleString()} total</p>
                                </div>
                              )}

                              {/* Selection indicator */}
                              {selected?.resourceId === member.resourceId && (
                                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>

          {/* Summary panel */}
          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Team Summary</CardTitle>
                <CardDescription>Selected team composition</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected members */}
                <div className="space-y-2">
                  {Array.from(selectedTeam.entries()).map(([reqId, member]) => {
                    const req = requirements.find(r => r.id === reqId);
                    return (
                      <div key={reqId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.resource.avatar} />
                          <AvatarFallback>
                            {member.resource.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.resource.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{req?.roleName}</p>
                        </div>
                        <span className="text-xs font-medium">{member.matchScore}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Team Size</span>
                    <span className="font-medium">{selectedTeam.size} / {requirements.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Match Score</span>
                    <span className={cn(
                      "font-medium",
                      avgMatchScore >= 70 ? "text-success" :
                      avgMatchScore >= 50 ? "text-warning" : "text-destructive"
                    )}>
                      {avgMatchScore}%
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className="text-sm font-medium">
                        {avgMatchScore >= 70 ? 'High' : avgMatchScore >= 50 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                    <Progress value={avgMatchScore} className="h-2" />
                  </div>
                </div>

                {/* Cost */}
                {canViewPricing('total') && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Team Cost</span>
                      <span className="text-lg font-bold">${totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <Button className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Submit Proposal
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setStep('requirements')}>
                    Edit Requirements
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
