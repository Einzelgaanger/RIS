import { useState, useMemo } from 'react';
import { mockResources, mockProposals, mockOpportunities, getProficiencyLabel, getTierLabel } from '@/data/mockData';
import { Resource, RoleRequirement, Proposal, TeamMember, ExperienceLevel, Opportunity } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Upload, FileText, Sparkles, Users, CheckCircle, ChevronRight, ChevronDown,
  Plus, Trash2, Edit, Target, DollarSign, AlertTriangle, Loader2, Link2,
  FolderPlus, GripVertical, X, Layers, Cpu, Hand
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type Step = 'upload' | 'requirements' | 'suggestions';
type BuilderMode = 'ai' | 'manual';
type ProjectSource = 'new' | 'opportunity';

// Skill levels for manual builder
const SKILL_LEVELS = [
  { level: 1, label: 'Level 1 — Expert', description: '10+ years, thought leader', color: 'bg-red-600 text-white' },
  { level: 2, label: 'Level 2 — Advanced', description: '6-10 years, independent lead', color: 'bg-orange-500 text-white' },
  { level: 3, label: 'Level 3 — Proficient', description: '3-6 years, capable delivery', color: 'bg-amber-500 text-white' },
  { level: 4, label: 'Level 4 — Intermediate', description: '1-3 years, guided delivery', color: 'bg-sky-500 text-white' },
  { level: 5, label: 'Level 5 — Junior', description: '< 1 year, support role', color: 'bg-slate-500 text-white' },
];

// Available skill categories
const SKILL_CATEGORIES = [
  { category: 'Technology', skills: ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Flutter', 'React Native', 'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'DevOps', 'CI/CD', 'API Development', 'System Architecture', 'Mobile Development', 'Cybersecurity'] },
  { category: 'Data & Analytics', skills: ['Data Analysis', 'Machine Learning', 'SQL', 'PostgreSQL', 'MongoDB', 'Data Visualization', 'Tableau', 'Power BI', 'Excel Advanced'] },
  { category: 'Management', skills: ['Project Management', 'Product Management', 'Agile/Scrum', 'Stakeholder Management', 'Team Leadership', 'Strategic Advisory'] },
  { category: 'Design & Research', skills: ['UX Design', 'UI Design', 'Research', 'Data Collection', 'Report Writing'] },
  { category: 'Domain', skills: ['Financial Modeling', 'Business Development', 'Public Policy', 'Digital Transformation'] },
];

interface SkillSlot {
  id: string;
  skillName: string;
  level: number;
  quantity: number;
}

// Simulated AI ranking algorithm
function calculateMatchScore(resource: Resource, requirement: RoleRequirement): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const matchingSkills = resource.skills.filter(s => 
    requirement.requiredSkills.some(rs => s.name.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(s.name.toLowerCase()))
  );
  const skillScore = Math.min((matchingSkills.length / requirement.requiredSkills.length) * 40, 40);
  score += skillScore;
  if (matchingSkills.length > 0) {
    reasons.push(`${matchingSkills.length} matching skills: ${matchingSkills.slice(0, 3).map(s => s.name).join(', ')}`);
  }

  const avgExperience = resource.skills.reduce((acc, s) => acc + s.yearsExperience, 0) / resource.skills.length;
  const expLevelYears: Record<ExperienceLevel, number> = { junior: 2, mid: 5, senior: 8, expert: 12 };
  const requiredYears = expLevelYears[requirement.experienceLevel];
  const expScore = Math.min((avgExperience / requiredYears) * 20, 20);
  score += expScore;
  if (avgExperience >= requiredYears) {
    reasons.push(`${Math.round(avgExperience)} years average experience`);
  }

  const tierScores: Record<number, number> = { 1: 15, 2: 12, 3: 8, 4: 4 };
  score += tierScores[resource.tier] || 0;
  if (resource.tier <= 2) {
    reasons.push(`Tier ${resource.tier} - ${getTierLabel(resource.tier)}`);
  }

  const avgRating = [...resource.managerFeedback, ...resource.clientFeedback].reduce((acc, f) => acc + f.rating, 0) /
    Math.max([...resource.managerFeedback, ...resource.clientFeedback].length, 1);
  const perfScore = (avgRating / 5) * 15;
  score += perfScore;
  if (avgRating >= 4) {
    reasons.push(`${avgRating.toFixed(1)}★ average rating`);
  }

  const availScore = Math.min((resource.weeklyAvailability / 40) * 10, 10);
  score += availScore;
  if (resource.weeklyAvailability >= 30) {
    reasons.push(`${resource.weeklyAvailability}h/week available`);
  }

  return { score: Math.round(score), reasons };
}

// Match resources to manual skill slots
function matchResourceToSlot(resource: Resource, slot: SkillSlot): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const hasSkill = resource.skills.find(s => s.name.toLowerCase() === slot.skillName.toLowerCase());
  if (hasSkill) {
    score += 40;
    reasons.push(`Has ${slot.skillName} (${getProficiencyLabel(hasSkill.proficiency)})`);
    
    // Proficiency match
    const profDiff = Math.abs(hasSkill.proficiency - (6 - slot.level));
    score += Math.max(0, 20 - profDiff * 5);
    
    // Experience bonus
    const levelYears = [12, 8, 5, 3, 1];
    if (hasSkill.yearsExperience >= levelYears[slot.level - 1]) {
      score += 15;
      reasons.push(`${hasSkill.yearsExperience} years experience`);
    }
  }

  // Tier & availability
  const tierScores: Record<number, number> = { 1: 15, 2: 12, 3: 8, 4: 4 };
  score += tierScores[resource.tier] || 0;
  if (resource.tier <= 2) reasons.push(`Tier ${resource.tier}`);
  
  const availScore = Math.min((resource.weeklyAvailability / 40) * 10, 10);
  score += availScore;

  return { score: Math.round(score), reasons };
}

export default function TeamBuilder() {
  const { user, canUploadProposals, canViewPricing } = useAuth();
  const [builderMode, setBuilderMode] = useState<BuilderMode>('ai');
  const [step, setStep] = useState<Step>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Project source state
  const [projectSource, setProjectSource] = useState<ProjectSource>('new');
  const [linkedOpportunityId, setLinkedOpportunityId] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  
  // Form state (AI mode)
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalClient, setProposalClient] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [requirements, setRequirements] = useState<RoleRequirement[]>([]);
  const [teamSuggestions, setTeamSuggestions] = useState<Map<string, TeamMember[]>>(new Map());
  const [selectedTeam, setSelectedTeam] = useState<Map<string, TeamMember>>(new Map());

  // Manual mode state
  const [skillSlots, setSkillSlots] = useState<SkillSlot[]>([]);
  const [manualSuggestions, setManualSuggestions] = useState<Map<string, TeamMember[]>>(new Map());
  const [manualSelectedTeam, setManualSelectedTeam] = useState<Map<string, TeamMember>>(new Map());
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [manualStep, setManualStep] = useState<'build' | 'results'>('build');

  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Handle file upload with project linking
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockExtracted: RoleRequirement[] = [
      { id: generateId(), roleName: 'Team Lead / Senior Consultant', requiredSkills: ['Strategic Advisory', 'Project Management', 'Stakeholder Management'], experienceLevel: 'expert', effortDays: 60, startDate: '2025-03-01', endDate: '2025-08-31' },
      { id: generateId(), roleName: 'Data Analyst', requiredSkills: ['Data Analysis', 'Python', 'SQL', 'Tableau'], experienceLevel: 'senior', effortDays: 90, startDate: '2025-03-01', endDate: '2025-08-31' },
      { id: generateId(), roleName: 'Research Associate', requiredSkills: ['Research', 'Data Collection', 'Report Writing'], experienceLevel: 'mid', effortDays: 120, startDate: '2025-03-01', endDate: '2025-08-31' },
    ];

    setProposalTitle(file.name.replace(/\.[^/.]+$/, ''));
    setRequirements(mockExtracted);
    setIsProcessing(false);
    setStep('requirements');
    toast({ title: 'Document processed', description: `Extracted ${mockExtracted.length} role requirements` });
  };

  // Link to opportunity
  const handleLinkOpportunity = (oppId: string) => {
    const opp = mockOpportunities.find(o => o.id === oppId);
    if (opp) {
      setLinkedOpportunityId(oppId);
      setProposalTitle(opp.title);
      setProposalClient(opp.client);
      setProposalDescription(opp.description);
      setRequirements([{
        id: generateId(),
        roleName: opp.title,
        requiredSkills: opp.requiredSkills,
        experienceLevel: opp.experienceLevel,
        effortDays: opp.effortDays,
        startDate: opp.startDate,
        endDate: opp.endDate,
      }]);
    }
  };

  const addRequirement = () => {
    setRequirements([...requirements, {
      id: generateId(), roleName: '', requiredSkills: [], experienceLevel: 'mid',
      effortDays: 30, startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }]);
  };

  const removeRequirement = (id: string) => setRequirements(requirements.filter(r => r.id !== id));
  const updateRequirement = (id: string, updates: Partial<RoleRequirement>) => setRequirements(requirements.map(r => r.id === id ? { ...r, ...updates } : r));

  // AI mode: generate suggestions
  const generateSuggestions = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const suggestions = new Map<string, TeamMember[]>();
    const initialSelected = new Map<string, TeamMember>();
    requirements.forEach(req => {
      const scored = mockResources.map(resource => {
        const { score, reasons } = calculateMatchScore(resource, req);
        return { resourceId: resource.id, resource, roleName: req.roleName, matchScore: score, matchReasons: reasons, dailyRate: resource.pricing.totalBillableRate, totalCost: resource.pricing.totalBillableRate * req.effortDays, selected: false };
      }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
      suggestions.set(req.id, scored);
      if (scored.length > 0) initialSelected.set(req.id, { ...scored[0], selected: true });
    });
    setTeamSuggestions(suggestions);
    setSelectedTeam(initialSelected);
    setIsProcessing(false);
    setStep('suggestions');
    toast({ title: 'Team suggestions generated', description: 'AI has matched resources to your requirements' });
  };

  const selectTeamMember = (reqId: string, member: TeamMember) => {
    setSelectedTeam(new Map(selectedTeam).set(reqId, { ...member, selected: true }));
  };

  // Manual mode functions
  const addSkillSlot = (skillName: string, level: number) => {
    setSkillSlots([...skillSlots, { id: generateId(), skillName, level, quantity: 1 }]);
    setShowSkillPicker(false);
  };

  const removeSkillSlot = (id: string) => {
    setSkillSlots(skillSlots.filter(s => s.id !== id));
    const newSugg = new Map(manualSuggestions);
    newSugg.delete(id);
    setManualSuggestions(newSugg);
  };

  const updateSlotLevel = (id: string, level: number) => {
    setSkillSlots(skillSlots.map(s => s.id === id ? { ...s, level } : s));
  };

  const updateSlotQuantity = (id: string, quantity: number) => {
    setSkillSlots(skillSlots.map(s => s.id === id ? { ...s, quantity: Math.max(1, quantity) } : s));
  };

  const generateManualSuggestions = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const suggestions = new Map<string, TeamMember[]>();
    const initialSelected = new Map<string, TeamMember>();
    skillSlots.forEach(slot => {
      const scored = mockResources.map(resource => {
        const { score, reasons } = matchResourceToSlot(resource, slot);
        return { resourceId: resource.id, resource, roleName: `${slot.skillName} (Level ${slot.level})`, matchScore: score, matchReasons: reasons, dailyRate: resource.pricing.totalBillableRate, totalCost: resource.pricing.totalBillableRate * 30, selected: false };
      }).filter(m => m.matchScore > 20).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
      suggestions.set(slot.id, scored);
      if (scored.length > 0) initialSelected.set(slot.id, { ...scored[0], selected: true });
    });
    setManualSuggestions(suggestions);
    setManualSelectedTeam(initialSelected);
    setIsProcessing(false);
    setManualStep('results');
    toast({ title: 'Matches found', description: `Found candidates for ${skillSlots.length} skill slots` });
  };

  // Calculated values
  const totalCost = useMemo(() => Array.from(selectedTeam.values()).reduce((acc, m) => acc + m.totalCost, 0), [selectedTeam]);
  const avgMatchScore = useMemo(() => {
    const members = Array.from(selectedTeam.values());
    return members.length === 0 ? 0 : Math.round(members.reduce((acc, m) => acc + m.matchScore, 0) / members.length);
  }, [selectedTeam]);
  const manualTotalCost = useMemo(() => Array.from(manualSelectedTeam.values()).reduce((acc, m) => acc + m.totalCost, 0), [manualSelectedTeam]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Builder</h1>
        <p className="text-muted-foreground">Build your project team using AI matching or manual skill selection</p>
      </div>

      {/* Mode Selector */}
      <Tabs value={builderMode} onValueChange={(v) => setBuilderMode(v as BuilderMode)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ai" className="gap-2">
            <Cpu className="h-4 w-4" />
            AI Team Builder
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Hand className="h-4 w-4" />
            Manual Builder
          </TabsTrigger>
        </TabsList>

        {/* ─────────────────────── AI MODE ─────────────────────── */}
        <TabsContent value="ai" className="mt-6 space-y-6">
          {/* Progress steps */}
          <div className="flex items-center gap-4">
            {(['upload', 'requirements', 'suggestions'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                  step === s ? "bg-primary text-primary-foreground" :
                  ['requirements', 'suggestions'].indexOf(step) > ['upload', 'requirements', 'suggestions'].indexOf(s)
                    ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {['requirements', 'suggestions'].indexOf(step) > ['upload', 'requirements', 'suggestions'].indexOf(s) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : i + 1}
                </div>
                <span className={cn("text-sm font-medium capitalize hidden sm:inline", step === s ? "text-primary" : "text-muted-foreground")}>{s}</span>
                {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* File upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload Document</CardTitle>
                    <CardDescription>Upload a Terms of Reference (ToR) or proposal document</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">Drag and drop or click to upload</p>
                      <Input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} className="max-w-xs mx-auto" disabled={isProcessing} />
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
                    <CardTitle className="flex items-center gap-2"><Edit className="h-5 w-5" /> Manual Entry</CardTitle>
                    <CardDescription>Or enter requirements manually</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Proposal Title</Label>
                      <Input value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)} placeholder="e.g., Digital Financial Services Assessment" />
                    </div>
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Input value={proposalClient} onChange={(e) => setProposalClient(e.target.value)} placeholder="e.g., World Bank" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={proposalDescription} onChange={(e) => setProposalDescription(e.target.value)} placeholder="Brief description of the project..." rows={3} />
                    </div>
                    <Button className="w-full" onClick={() => setStep('requirements')} disabled={!proposalTitle}>
                      Continue to Requirements <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Project Source: Link to Opportunity or Create New */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Context</CardTitle>
                  <CardDescription>Link this document to an existing opportunity or create a new project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* New Project */}
                    <button
                      onClick={() => setProjectSource('new')}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all",
                        projectSource === 'new' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FolderPlus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">New Project</p>
                          <p className="text-xs text-muted-foreground">Create a standalone project from this document</p>
                        </div>
                      </div>
                      {projectSource === 'new' && (
                        <div className="mt-3 space-y-2">
                          <Label className="text-xs">Project Name</Label>
                          <Input
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g., West Africa DFS Assessment 2025"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </button>

                    {/* Link to Opportunity */}
                    <button
                      onClick={() => setProjectSource('opportunity')}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all",
                        projectSource === 'opportunity' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-secondary/10">
                          <Link2 className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <p className="font-semibold">Link to Opportunity</p>
                          <p className="text-xs text-muted-foreground">Associate with an existing opportunity</p>
                        </div>
                      </div>
                      {projectSource === 'opportunity' && (
                        <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                          <Label className="text-xs">Select Opportunity</Label>
                          <Select value={linkedOpportunityId} onValueChange={handleLinkOpportunity}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose opportunity..." />
                            </SelectTrigger>
                            <SelectContent>
                              {mockOpportunities.filter(o => o.status === 'open' || o.status === 'draft').map(opp => (
                                <SelectItem key={opp.id} value={opp.id}>
                                  <div className="flex flex-col">
                                    <span>{opp.title}</span>
                                    <span className="text-xs text-muted-foreground">{opp.client}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {linkedOpportunityId && (
                            <div className="p-2 rounded bg-muted text-xs">
                              <p className="font-medium">{mockOpportunities.find(o => o.id === linkedOpportunityId)?.title}</p>
                              <p className="text-muted-foreground">{mockOpportunities.find(o => o.id === linkedOpportunityId)?.client} • {mockOpportunities.find(o => o.id === linkedOpportunityId)?.effortDays} days</p>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent proposals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Proposals</CardTitle>
                  <CardDescription>Continue working on a saved proposal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {mockProposals.slice(0, 3).map((proposal) => (
                      <button key={proposal.id} className="p-4 text-left rounded-lg border hover:bg-accent/50 transition-colors" onClick={() => {
                        setProposalTitle(proposal.title);
                        setProposalClient(proposal.client);
                        setRequirements(proposal.extractedRequirements);
                        setStep('requirements');
                      }}>
                        <p className="font-medium truncate">{proposal.title}</p>
                        <p className="text-sm text-muted-foreground">{proposal.client}</p>
                        <Badge variant="outline" className="mt-2 text-xs">{proposal.extractedRequirements.length} roles</Badge>
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
              {/* Linked context banner */}
              {(projectSource === 'opportunity' && linkedOpportunityId) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                  <Link2 className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">Linked to: {mockOpportunities.find(o => o.id === linkedOpportunityId)?.title}</span>
                </div>
              )}
              {(projectSource === 'new' && projectName) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <FolderPlus className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Project: {projectName}</span>
                </div>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{proposalTitle || 'New Proposal'}</CardTitle>
                    <CardDescription>Define the roles and requirements for your team</CardDescription>
                  </div>
                  <Button onClick={addRequirement} variant="outline"><Plus className="h-4 w-4 mr-2" /> Add Role</Button>
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
                          <span className="text-sm font-medium text-muted-foreground">Role {index + 1}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRequirement(req.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2"><Label>Role Name</Label><Input value={req.roleName} onChange={(e) => updateRequirement(req.id, { roleName: e.target.value })} placeholder="e.g., Senior Data Analyst" /></div>
                          <div className="space-y-2">
                            <Label>Experience Level</Label>
                            <Select value={req.experienceLevel} onValueChange={(v) => updateRequirement(req.id, { experienceLevel: v as ExperienceLevel })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
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
                          <Input value={req.requiredSkills.join(', ')} onChange={(e) => updateRequirement(req.id, { requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="e.g., Python, SQL, Data Analysis" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2"><Label>Effort (days)</Label><Input type="number" value={req.effortDays} onChange={(e) => updateRequirement(req.id, { effortDays: parseInt(e.target.value) || 0 })} /></div>
                          <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={req.startDate} onChange={(e) => updateRequirement(req.id, { startDate: e.target.value })} /></div>
                          <div className="space-y-2"><Label>End Date</Label><Input type="date" value={req.endDate} onChange={(e) => updateRequirement(req.id, { endDate: e.target.value })} /></div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
                <Button onClick={generateSuggestions} disabled={requirements.length === 0 || requirements.some(r => !r.roleName) || isProcessing}>
                  {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate Team Suggestions</>}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Suggestions */}
          {step === 'suggestions' && (
            <div className="grid gap-6 lg:grid-cols-3">
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
                              <CardDescription>{req.experienceLevel} • {req.effortDays} days • {req.requiredSkills.slice(0, 3).join(', ')}</CardDescription>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          </CollapsibleTrigger>
                        </CardHeader>
                        <CollapsibleContent>
                          <CardContent className="pt-0 space-y-3">
                            {suggestions.map((member) => (
                              <div key={member.resourceId} className={cn("p-3 rounded-lg border cursor-pointer transition-all", selected?.resourceId === member.resourceId ? "border-primary bg-primary/5" : "hover:bg-accent/50")} onClick={() => selectTeamMember(req.id, member)}>
                                <div className="flex items-start gap-3">
                                  <div className={cn("match-score flex-shrink-0", member.matchScore >= 70 ? "match-score-high" : member.matchScore >= 50 ? "match-score-medium" : "match-score-low")}>{member.matchScore}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8"><AvatarImage src={member.resource.avatar} /><AvatarFallback>{member.resource.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                                      <div><p className="font-medium text-sm">{member.resource.fullName}</p><p className="text-xs text-muted-foreground">{member.resource.organization}</p></div>
                                      <TierBadge tier={member.resource.tier} />
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {member.matchReasons.slice(0, 3).map((reason, i) => (<span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{reason}</span>))}
                                    </div>
                                  </div>
                                  {canViewPricing('total') && (
                                    <div className="text-right flex-shrink-0"><p className="text-sm font-semibold">${member.dailyRate}/day</p><p className="text-xs text-muted-foreground">${member.totalCost.toLocaleString()} total</p></div>
                                  )}
                                  {selected?.resourceId === member.resourceId && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />}
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
                  <CardHeader><CardTitle className="text-lg">Team Summary</CardTitle><CardDescription>Selected team composition</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {Array.from(selectedTeam.entries()).map(([reqId, member]) => {
                        const req = requirements.find(r => r.id === reqId);
                        return (
                          <div key={reqId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Avatar className="h-8 w-8"><AvatarImage src={member.resource.avatar} /><AvatarFallback>{member.resource.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{member.resource.fullName}</p><p className="text-xs text-muted-foreground truncate">{req?.roleName}</p></div>
                            <span className="text-xs font-medium">{member.matchScore}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Team Size</span><span className="font-medium">{selectedTeam.size} / {requirements.length}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Avg Match Score</span><span className={cn("font-medium", avgMatchScore >= 70 ? "text-green-600" : avgMatchScore >= 50 ? "text-amber-500" : "text-destructive")}>{avgMatchScore}%</span></div>
                      <div><div className="flex items-center justify-between mb-1"><span className="text-sm text-muted-foreground">Confidence</span><span className="text-sm font-medium">{avgMatchScore >= 70 ? 'High' : avgMatchScore >= 50 ? 'Medium' : 'Low'}</span></div><Progress value={avgMatchScore} className="h-2" /></div>
                    </div>
                    {canViewPricing('total') && (
                      <div className="pt-4 border-t"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total Team Cost</span><span className="text-lg font-bold">${totalCost.toLocaleString()}</span></div></div>
                    )}
                    <div className="pt-4 space-y-2">
                      <Button className="w-full"><DollarSign className="h-4 w-4 mr-2" /> Submit Proposal</Button>
                      <Button variant="outline" className="w-full" onClick={() => setStep('requirements')}>Edit Requirements</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─────────────────────── MANUAL MODE ─────────────────────── */}
        <TabsContent value="manual" className="mt-6 space-y-6">
          {manualStep === 'build' && (
            <>
              {/* Instructions */}
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Layers className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">How it works</p>
                      <p className="text-sm text-muted-foreground">Add skill sets at the required proficiency level (1 = Expert, 5 = Junior). Set quantity needed for each. Then find matching resources.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project context for manual mode too */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Context</CardTitle>
                  <CardDescription>Optionally link to an existing opportunity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <button onClick={() => setProjectSource('new')} className={cn("p-4 rounded-lg border-2 text-left transition-all", projectSource === 'new' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                      <div className="flex items-center gap-3">
                        <FolderPlus className="h-5 w-5 text-primary" />
                        <div><p className="font-semibold text-sm">New Project</p><p className="text-xs text-muted-foreground">Standalone project</p></div>
                      </div>
                      {projectSource === 'new' && (
                        <div className="mt-3"><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name..." onClick={(e) => e.stopPropagation()} /></div>
                      )}
                    </button>
                    <button onClick={() => setProjectSource('opportunity')} className={cn("p-4 rounded-lg border-2 text-left transition-all", projectSource === 'opportunity' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                      <div className="flex items-center gap-3">
                        <Link2 className="h-5 w-5 text-secondary" />
                        <div><p className="font-semibold text-sm">Link to Opportunity</p><p className="text-xs text-muted-foreground">Associate with existing</p></div>
                      </div>
                      {projectSource === 'opportunity' && (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                          <Select value={linkedOpportunityId} onValueChange={(v) => setLinkedOpportunityId(v)}>
                            <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                            <SelectContent>
                              {mockOpportunities.filter(o => o.status === 'open' || o.status === 'draft').map(opp => (
                                <SelectItem key={opp.id} value={opp.id}>{opp.title} — {opp.client}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Skill Slots Box */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Skill Requirements</CardTitle>
                    <CardDescription>Add the skills and levels you need for this project</CardDescription>
                  </div>
                  <Button onClick={() => setShowSkillPicker(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Skill
                  </Button>
                </CardHeader>
                <CardContent>
                  {skillSlots.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-12 text-center">
                      <GripVertical className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground font-medium">No skills added yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Click "Add Skill" to start building your team requirements</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {skillSlots.map((slot) => {
                        const levelInfo = SKILL_LEVELS.find(l => l.level === slot.level)!;
                        return (
                          <div key={slot.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                            <div className="flex items-center gap-1 text-muted-foreground cursor-grab">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <Badge className={cn("text-xs min-w-[80px] justify-center", levelInfo.color)}>
                              Level {slot.level}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{slot.skillName}</p>
                              <p className="text-xs text-muted-foreground">{levelInfo.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Qty:</Label>
                              <Select value={String(slot.quantity)} onValueChange={(v) => updateSlotQuantity(slot.id, parseInt(v))}>
                                <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <Select value={String(slot.level)} onValueChange={(v) => updateSlotLevel(slot.id, parseInt(v))}>
                                <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {SKILL_LEVELS.map(l => <SelectItem key={l.level} value={String(l.level)}>{l.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSkillSlot(slot.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Summary bar */}
                  {skillSlots.length > 0 && (
                    <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4 text-sm">
                        <span><strong>{skillSlots.length}</strong> skill types</span>
                        <span><strong>{skillSlots.reduce((acc, s) => acc + s.quantity, 0)}</strong> total positions</span>
                      </div>
                      <Button onClick={generateManualSuggestions} disabled={isProcessing}>
                        {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Matching...</> : <><Users className="mr-2 h-4 w-4" /> Find Matching Resources</>}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {manualStep === 'results' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Matched Resources</h2>
                <Button variant="outline" onClick={() => setManualStep('build')}>← Edit Skills</Button>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  {skillSlots.map((slot) => {
                    const suggestions = manualSuggestions.get(slot.id) || [];
                    const selected = manualSelectedTeam.get(slot.id);
                    const levelInfo = SKILL_LEVELS.find(l => l.level === slot.level)!;
                    return (
                      <Collapsible key={slot.id} defaultOpen>
                        <Card>
                          <CardHeader className="pb-3">
                            <CollapsibleTrigger className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2 text-left">
                                <Badge className={cn("text-xs", levelInfo.color)}>L{slot.level}</Badge>
                                <div>
                                  <CardTitle className="text-base">{slot.skillName}</CardTitle>
                                  <CardDescription>{levelInfo.description} • {slot.quantity} needed</CardDescription>
                                </div>
                              </div>
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            </CollapsibleTrigger>
                          </CardHeader>
                          <CollapsibleContent>
                            <CardContent className="pt-0 space-y-3">
                              {suggestions.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  No strong matches found for this skill/level combination
                                </div>
                              ) : suggestions.map((member) => (
                                <div key={member.resourceId} className={cn("p-3 rounded-lg border cursor-pointer transition-all", selected?.resourceId === member.resourceId ? "border-primary bg-primary/5" : "hover:bg-accent/50")} onClick={() => setManualSelectedTeam(new Map(manualSelectedTeam).set(slot.id, { ...member, selected: true }))}>
                                  <div className="flex items-start gap-3">
                                    <div className={cn("match-score flex-shrink-0", member.matchScore >= 70 ? "match-score-high" : member.matchScore >= 50 ? "match-score-medium" : "match-score-low")}>{member.matchScore}</div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8"><AvatarImage src={member.resource.avatar} /><AvatarFallback>{member.resource.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                                        <div><p className="font-medium text-sm">{member.resource.fullName}</p><p className="text-xs text-muted-foreground">{member.resource.organization} • {member.resource.title}</p></div>
                                        <TierBadge tier={member.resource.tier} />
                                      </div>
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {member.matchReasons.map((reason, i) => (<span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{reason}</span>))}
                                      </div>
                                    </div>
                                    {canViewPricing('total') && (
                                      <div className="text-right flex-shrink-0"><p className="text-sm font-semibold">${member.dailyRate}/day</p></div>
                                    )}
                                    {selected?.resourceId === member.resourceId && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />}
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

                {/* Manual summary */}
                <Card className="sticky top-20 h-fit">
                  <CardHeader><CardTitle className="text-lg">Team Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {Array.from(manualSelectedTeam.entries()).map(([slotId, member]) => {
                        const slot = skillSlots.find(s => s.id === slotId);
                        return (
                          <div key={slotId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Avatar className="h-8 w-8"><AvatarImage src={member.resource.avatar} /><AvatarFallback>{member.resource.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{member.resource.fullName}</p><p className="text-xs text-muted-foreground truncate">{slot?.skillName} (L{slot?.level})</p></div>
                            <span className="text-xs font-medium">{member.matchScore}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Filled</span><span className="font-medium">{manualSelectedTeam.size} / {skillSlots.length}</span></div>
                      {canViewPricing('total') && (
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Est. Monthly Cost</span><span className="font-bold">${manualTotalCost.toLocaleString()}</span></div>
                      )}
                    </div>
                    <Button className="w-full"><DollarSign className="h-4 w-4 mr-2" /> Submit Team</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Skill Picker Dialog */}
      <Dialog open={showSkillPicker} onOpenChange={setShowSkillPicker}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Skill Requirement</DialogTitle>
            <DialogDescription>Select a skill and the proficiency level required</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {SKILL_CATEGORIES.map(cat => (
              <div key={cat.category}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">{cat.category}</h4>
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => addSkillSlot(skill, 3)}
                      className="px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
