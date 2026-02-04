// User roles and authentication
export type UserRole = 'gvts_admin' | 'vgg_manager' | 'professional' | 'guest';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organization: string;
  avatar?: string;
}

// Tier classification
export type Tier = 1 | 2 | 3 | 4;

export interface TierInfo {
  tier: Tier;
  label: string;
  description: string;
  color: string;
}

// Location
export interface Location {
  country: string;
  city: string;
  remote: boolean;
}

// Skills
export interface Skill {
  name: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
  yearsExperience: number;
  validated: boolean;
  validatedBy?: string;
}

// Certifications
export interface Certification {
  name: string;
  issuer: string;
  year: number;
}

// Delivery examples
export interface DeliveryExample {
  title: string;
  description: string;
  client: string;
  outcome: string;
}

// Client references
export interface ClientReference {
  name: string;
  organization: string;
  role: string;
}

// Feedback
export interface Feedback {
  id: string;
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comments: string;
  authorId: string;
  authorName: string;
}

// Blackout periods
export interface BlackoutPeriod {
  start: string;
  end: string;
  reason: string;
}

// Pricing (visibility restricted by role)
export interface Pricing {
  individualDailyRate: number;
  organizationReleaseFee: number;
  gvtsMargin: number;
  totalBillableRate: number;
  currency: string;
}

// Contractual status
export type ContractualStatus = 'permanent' | 'contract' | 'casual' | 'temp' | 'associate';

// Resource profile
export interface Resource {
  id: string;
  fullName: string;
  email: string;
  organization: string;
  division: string;
  location: Location;
  lineManager: string;
  contractualStatus: ContractualStatus;
  fteStatus: number;
  tier: Tier;
  skills: Skill[];
  vggExperienceYears: number;
  certifications: Certification[];
  deliveryExamples: DeliveryExample[];
  linkedProjects: string[];
  aiBidReadySummary: string;
  clientReferences: ClientReference[];
  managerFeedback: Feedback[];
  clientFeedback: Feedback[];
  reliabilityScore: number;
  qualityScore: number;
  weeklyAvailability: number;
  monthlyAvailability: number;
  blackoutPeriods: BlackoutPeriod[];
  currentAssignments: string[];
  pricing: Pricing;
  profileCompleteness: number;
  lastUpdated: string;
  createdAt: string;
  avatar?: string;
  title?: string;
}

// Experience level
export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'expert';

// Role requirement for proposals
export interface RoleRequirement {
  id: string;
  roleName: string;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  effortDays: number;
  startDate: string;
  endDate: string;
}

// Proposal/ToR
export interface Proposal {
  id: string;
  title: string;
  client: string;
  description: string;
  uploadedDocument?: string;
  extractedRequirements: RoleRequirement[];
  totalBudget: number;
  status: 'draft' | 'in_progress' | 'submitted' | 'won' | 'lost';
  createdAt: string;
  createdBy: string;
}

// Team member suggestion
export interface TeamMember {
  resourceId: string;
  resource: Resource;
  roleName: string;
  matchScore: number;
  matchReasons: string[];
  dailyRate: number;
  totalCost: number;
  selected: boolean;
}

// Team suggestion
export interface TeamSuggestion {
  proposalId: string;
  coreTeam: TeamMember[];
  alternates: TeamMember[];
  riskMitigatedOptions: {
    description: string;
    resourceId: string;
    rationale: string;
  }[];
  totalTeamCost: number;
  estimatedMargin: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  generatedAt: string;
}

// Opportunity status
export type OpportunityStatus = 'draft' | 'open' | 'filled' | 'closed';

// Applicant status
export type ApplicantStatus = 'interested' | 'shortlisted' | 'selected' | 'rejected';

// Applicant
export interface Applicant {
  resourceId: string;
  appliedAt: string;
  status: ApplicantStatus;
}

// Opportunity
export interface Opportunity {
  id: string;
  title: string;
  client: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  location: string;
  startDate: string;
  endDate: string;
  effortDays: number;
  dailyRate: number;
  status: OpportunityStatus;
  visibility: 'internal' | 'vgg-wide' | 'specific-teams';
  createdBy: string;
  applicants: Applicant[];
  createdAt: string;
}

// Assignment status
export type AssignmentStatus = 'planned' | 'active' | 'completed' | 'cancelled';

// Assignment
export interface Assignment {
  id: string;
  opportunityId: string;
  resourceId: string;
  startDate: string;
  endDate: string;
  actualEffort: number;
  status: AssignmentStatus;
  deliverables: string[];
  performanceRating?: number;
  clientFeedback?: string;
}

// Analytics data
export interface AnalyticsData {
  utilizationRate: number;
  totalResources: number;
  availableResources: number;
  openOpportunities: number;
  activeAssignments: number;
  totalRevenue: number;
  totalCost: number;
  averageMargin: number;
  skillsGap: { skill: string; demand: number; supply: number }[];
  utilizationTrend: { month: string; rate: number }[];
  revenueVsCost: { month: string; revenue: number; cost: number }[];
  tierDistribution: { tier: string; count: number }[];
  topSkills: { skill: string; count: number }[];
}

// Report type
export type ReportType = 'utilization' | 'financial' | 'skills' | 'performance' | 'custom';

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  generatedAt: string;
  generatedBy: string;
  parameters?: Record<string, any>;
  data?: any;
}
