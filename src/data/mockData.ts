import { Resource, Opportunity, Proposal, User, AnalyticsData, Tier, ExperienceLevel, Skill, Assignment } from '@/types';

// Organizations
const organizations = [
  'GVTS', 'Riby', 'VerifyMe', 'Terragon', 'SystemSpecs', 'VGG Corporate',
  'Softcom', 'Flutterwave Partners', 'Paystack Partners', 'Interswitch Partners'
];

const divisions = [
  'Technology', 'Strategy', 'Operations', 'Finance', 'Product', 'Design', 'Data Science', 'Research'
];

const countries = [
  { country: 'Nigeria', cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan'] },
  { country: 'Kenya', cities: ['Nairobi', 'Mombasa', 'Kisumu'] },
  { country: 'Ghana', cities: ['Accra', 'Kumasi'] },
  { country: 'South Africa', cities: ['Johannesburg', 'Cape Town', 'Durban'] },
  { country: 'United Kingdom', cities: ['London', 'Manchester'] },
  { country: 'Rwanda', cities: ['Kigali'] },
];

const skillsList = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Data Analysis',
  'Machine Learning', 'Project Management', 'Product Management', 'UX Design',
  'UI Design', 'Strategic Advisory', 'Financial Modeling', 'Business Development',
  'Agile/Scrum', 'AWS', 'Azure', 'Google Cloud', 'SQL', 'PostgreSQL',
  'MongoDB', 'Data Visualization', 'Tableau', 'Power BI', 'Excel Advanced',
  'Stakeholder Management', 'Team Leadership', 'Public Policy', 'Digital Transformation',
  'API Development', 'Mobile Development', 'Flutter', 'React Native', 'System Architecture',
  'DevOps', 'CI/CD', 'Docker', 'Kubernetes', 'Cybersecurity'
];

const certifications = [
  { name: 'PMP', issuer: 'PMI' },
  { name: 'AWS Solutions Architect', issuer: 'Amazon' },
  { name: 'Google Cloud Professional', issuer: 'Google' },
  { name: 'Scrum Master', issuer: 'Scrum Alliance' },
  { name: 'CISSP', issuer: 'ISC²' },
  { name: 'CFA Level III', issuer: 'CFA Institute' },
  { name: 'Data Science Professional', issuer: 'IBM' },
  { name: 'Azure Administrator', issuer: 'Microsoft' },
];

const firstNames = [
  'Adaeze', 'Chidi', 'Emeka', 'Fatima', 'Grace', 'Hassan', 'Ibrahim', 'Jumoke',
  'Kofi', 'Lola', 'Mohammed', 'Ngozi', 'Oluwaseun', 'Patience', 'Rashid', 'Sade',
  'Tunde', 'Uche', 'Victoria', 'Wale', 'Xavier', 'Yemi', 'Zainab', 'Aisha',
  'Bola', 'Chisom', 'Daniel', 'Esther', 'Felix', 'Gloria', 'Henry', 'Ifeoma',
  'James', 'Kemi', 'Lekan', 'Miriam', 'Nnamdi', 'Ope', 'Peter', 'Queen',
  'Richard', 'Sandra', 'Tobi', 'Usman', 'Vivian', 'Williams', 'Xolani', 'Yusuf', 'Zara'
];

const lastNames = [
  'Adeyemi', 'Balogun', 'Chukwu', 'Dlamini', 'Eze', 'Fashola', 'Gambari', 'Hussain',
  'Igwe', 'Johnson', 'Kamau', 'Lawal', 'Musa', 'Nwachukwu', 'Okafor', 'Patel',
  'Qasim', 'Roberts', 'Suleiman', 'Thompson', 'Udoh', 'Venter', 'Williams', 'Yakubu',
  'Zuma', 'Afolabi', 'Bankole', 'Chibuike', 'Diallo', 'Ekwueme', 'Fagbenro', 'Gbenga'
];

const titles = [
  'Senior Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer',
  'Project Manager', 'Business Analyst', 'Solutions Architect', 'DevOps Engineer',
  'Technical Lead', 'Strategy Consultant', 'Financial Analyst', 'Research Lead',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
  'Data Engineer', 'ML Engineer', 'Cloud Architect', 'Security Specialist'
];

// Helper functions
function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function generateSkills(): Skill[] {
  const numSkills = randomNumber(4, 10);
  const selectedSkills = new Set<string>();
  
  while (selectedSkills.size < numSkills) {
    selectedSkills.add(randomFromArray(skillsList));
  }
  
  return Array.from(selectedSkills).map(name => ({
    name,
    proficiency: randomNumber(1, 5) as 1 | 2 | 3 | 4 | 5,
    yearsExperience: randomNumber(1, 15),
    validated: Math.random() > 0.3,
    validatedBy: Math.random() > 0.5 ? 'Manager' : 'Client',
  }));
}

function generateResource(index: number): Resource {
  const firstName = randomFromArray(firstNames);
  const lastName = randomFromArray(lastNames);
  const location = randomFromArray(countries);
  const city = randomFromArray(location.cities);
  
  const tier = randomNumber(1, 4) as Tier;
  const baseRate = tier === 1 ? randomNumber(800, 1500) : 
                   tier === 2 ? randomNumber(500, 900) :
                   tier === 3 ? randomNumber(300, 600) :
                   randomNumber(150, 400);
  
  const releaseFee = Math.round(baseRate * 0.15);
  const gvtsMargin = Math.round((baseRate + releaseFee) * 0.35);
  
  return {
    id: `res-${generateId()}`,
    fullName: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomFromArray(organizations).toLowerCase().replace(' ', '')}.com`,
    organization: randomFromArray(organizations),
    division: randomFromArray(divisions),
    location: {
      country: location.country,
      city,
      remote: Math.random() > 0.6,
    },
    lineManager: `${randomFromArray(firstNames)} ${randomFromArray(lastNames)}`,
    contractualStatus: randomFromArray(['permanent', 'contract', 'casual', 'temp', 'associate']),
    fteStatus: randomFromArray([0.5, 0.75, 1.0]),
    tier,
    skills: generateSkills(),
    vggExperienceYears: randomNumber(0, 12),
    certifications: Math.random() > 0.4 ? [
      { ...randomFromArray(certifications), year: randomNumber(2018, 2024) }
    ] : [],
    deliveryExamples: [
      {
        title: `${randomFromArray(['Led', 'Delivered', 'Managed', 'Architected'])} ${randomFromArray(['Digital Platform', 'Data Pipeline', 'Mobile App', 'Analytics Dashboard'])}`,
        description: 'Successfully delivered within timeline and budget',
        client: randomFromArray(['World Bank', 'GIZ', 'USAID', 'Bill & Melinda Gates Foundation', 'Mastercard Foundation']),
        outcome: randomFromArray(['30% efficiency improvement', '50% cost reduction', '2x user adoption', 'Award-winning solution']),
      }
    ],
    linkedProjects: [],
    aiBidReadySummary: `Experienced professional with ${randomNumber(3, 15)} years in ${randomFromArray(divisions)}. Strong track record in delivering complex projects.`,
    clientReferences: [
      {
        name: `${randomFromArray(firstNames)} ${randomFromArray(lastNames)}`,
        organization: randomFromArray(['World Bank', 'GIZ', 'USAID', 'AfDB']),
        role: randomFromArray(['Project Director', 'Program Manager', 'Technical Lead']),
      }
    ],
    managerFeedback: [
      {
        id: generateId(),
        date: '2024-06-15',
        rating: randomNumber(3, 5) as 1 | 2 | 3 | 4 | 5,
        comments: 'Excellent team player with strong technical skills.',
        authorId: generateId(),
        authorName: `${randomFromArray(firstNames)} ${randomFromArray(lastNames)}`,
      }
    ],
    clientFeedback: [
      {
        id: generateId(),
        date: '2024-08-20',
        rating: randomNumber(3, 5) as 1 | 2 | 3 | 4 | 5,
        comments: 'Delivered quality work on time.',
        authorId: generateId(),
        authorName: `${randomFromArray(firstNames)} ${randomFromArray(lastNames)}`,
      }
    ],
    reliabilityScore: randomNumber(70, 100),
    qualityScore: randomNumber(70, 100),
    weeklyAvailability: randomNumber(0, 40),
    monthlyAvailability: randomNumber(0, 20),
    blackoutPeriods: Math.random() > 0.7 ? [
      {
        start: '2025-03-01',
        end: '2025-03-15',
        reason: 'Annual leave',
      }
    ] : [],
    currentAssignments: [],
    pricing: {
      individualDailyRate: baseRate,
      organizationReleaseFee: releaseFee,
      gvtsMargin,
      totalBillableRate: baseRate + releaseFee + gvtsMargin,
      currency: 'USD',
    },
    profileCompleteness: randomNumber(60, 100),
    lastUpdated: new Date(Date.now() - randomNumber(0, 30) * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - randomNumber(30, 365) * 24 * 60 * 60 * 1000).toISOString(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`,
    title: randomFromArray(titles),
  };
}

// Generate 55 resources
export const mockResources: Resource[] = Array.from({ length: 55 }, (_, i) => generateResource(i));

// Generate opportunities
export const mockOpportunities: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Senior Data Analyst for Financial Inclusion Project',
    client: 'World Bank',
    description: 'Seeking an experienced data analyst to support a financial inclusion assessment across West Africa.',
    requiredSkills: ['Data Analysis', 'Python', 'SQL', 'Financial Modeling', 'Tableau'],
    experienceLevel: 'senior',
    location: 'Lagos, Nigeria (Hybrid)',
    startDate: '2025-03-01',
    endDate: '2025-09-30',
    effortDays: 120,
    dailyRate: 850,
    status: 'open',
    visibility: 'vgg-wide',
    createdBy: 'admin-1',
    applicants: [
      { resourceId: mockResources[0].id, appliedAt: '2025-01-15', status: 'shortlisted' },
      { resourceId: mockResources[3].id, appliedAt: '2025-01-16', status: 'interested' },
    ],
    createdAt: '2025-01-10',
  },
  {
    id: 'opp-2',
    title: 'Project Manager - Digital ID Implementation',
    client: 'GIZ',
    description: 'Lead the implementation of a national digital ID system pilot program.',
    requiredSkills: ['Project Management', 'Agile/Scrum', 'Stakeholder Management', 'Digital Transformation'],
    experienceLevel: 'expert',
    location: 'Nairobi, Kenya',
    startDate: '2025-04-01',
    endDate: '2025-12-31',
    effortDays: 180,
    dailyRate: 1200,
    status: 'open',
    visibility: 'internal',
    createdBy: 'admin-1',
    applicants: [],
    createdAt: '2025-01-12',
  },
  {
    id: 'opp-3',
    title: 'UX Designer for Healthcare Platform',
    client: 'Bill & Melinda Gates Foundation',
    description: 'Design user experiences for a maternal health tracking application.',
    requiredSkills: ['UX Design', 'UI Design', 'Mobile Development', 'User Research'],
    experienceLevel: 'mid',
    location: 'Remote',
    startDate: '2025-02-15',
    endDate: '2025-06-30',
    effortDays: 80,
    dailyRate: 600,
    status: 'open',
    visibility: 'vgg-wide',
    createdBy: 'admin-1',
    applicants: [
      { resourceId: mockResources[5].id, appliedAt: '2025-01-18', status: 'selected' },
    ],
    createdAt: '2025-01-08',
  },
  {
    id: 'opp-4',
    title: 'Full Stack Developer - Payments Platform',
    client: 'Mastercard Foundation',
    description: 'Build and maintain payment integration modules for SME lending platform.',
    requiredSkills: ['React', 'Node.js', 'PostgreSQL', 'API Development', 'AWS'],
    experienceLevel: 'senior',
    location: 'Accra, Ghana',
    startDate: '2025-03-15',
    endDate: '2025-09-15',
    effortDays: 130,
    dailyRate: 750,
    status: 'open',
    visibility: 'vgg-wide',
    createdBy: 'admin-1',
    applicants: [
      { resourceId: mockResources[8].id, appliedAt: '2025-01-20', status: 'interested' },
      { resourceId: mockResources[12].id, appliedAt: '2025-01-21', status: 'interested' },
    ],
    createdAt: '2025-01-14',
  },
  {
    id: 'opp-5',
    title: 'ML Engineer for Agricultural Analytics',
    client: 'USAID',
    description: 'Develop machine learning models for crop yield prediction and climate risk assessment.',
    requiredSkills: ['Machine Learning', 'Python', 'Data Science', 'TensorFlow', 'Data Visualization'],
    experienceLevel: 'senior',
    location: 'Kigali, Rwanda (Remote OK)',
    startDate: '2025-04-01',
    endDate: '2025-10-31',
    effortDays: 140,
    dailyRate: 900,
    status: 'draft',
    visibility: 'internal',
    createdBy: 'admin-1',
    applicants: [],
    createdAt: '2025-01-22',
  },
  {
    id: 'opp-6',
    title: 'Business Analyst - Public Sector Digital Services',
    client: 'African Development Bank',
    description: 'Analyze business requirements for citizen service delivery platform.',
    requiredSkills: ['Business Analysis', 'Requirements Gathering', 'Public Policy', 'Agile/Scrum'],
    experienceLevel: 'mid',
    location: 'Abuja, Nigeria',
    startDate: '2025-02-01',
    endDate: '2025-05-31',
    effortDays: 80,
    dailyRate: 550,
    status: 'filled',
    visibility: 'vgg-wide',
    createdBy: 'admin-1',
    applicants: [
      { resourceId: mockResources[15].id, appliedAt: '2025-01-05', status: 'selected' },
    ],
    createdAt: '2024-12-20',
  },
];

// Generate proposals
export const mockProposals: Proposal[] = [
  {
    id: 'prop-1',
    title: 'Digital Financial Services Assessment - West Africa',
    client: 'World Bank',
    description: 'Comprehensive assessment of digital financial services landscape across 5 West African countries.',
    extractedRequirements: [
      {
        id: 'req-1',
        roleName: 'Team Lead / Senior Consultant',
        requiredSkills: ['Strategic Advisory', 'Financial Inclusion', 'Stakeholder Management'],
        experienceLevel: 'expert',
        effortDays: 60,
        startDate: '2025-03-01',
        endDate: '2025-08-31',
      },
      {
        id: 'req-2',
        roleName: 'Data Analyst',
        requiredSkills: ['Data Analysis', 'Python', 'SQL', 'Tableau'],
        experienceLevel: 'senior',
        effortDays: 90,
        startDate: '2025-03-01',
        endDate: '2025-08-31',
      },
      {
        id: 'req-3',
        roleName: 'Research Associate',
        requiredSkills: ['Research', 'Data Collection', 'Report Writing'],
        experienceLevel: 'mid',
        effortDays: 120,
        startDate: '2025-03-01',
        endDate: '2025-08-31',
      },
    ],
    totalBudget: 350000,
    status: 'in_progress',
    createdAt: '2025-01-10',
    createdBy: 'admin-1',
  },
  {
    id: 'prop-2',
    title: 'National ID System Technical Assessment',
    client: 'GIZ',
    description: 'Technical assessment and roadmap development for national identity system modernization.',
    extractedRequirements: [
      {
        id: 'req-4',
        roleName: 'Solutions Architect',
        requiredSkills: ['System Architecture', 'Digital Transformation', 'Identity Systems'],
        experienceLevel: 'expert',
        effortDays: 40,
        startDate: '2025-04-01',
        endDate: '2025-06-30',
      },
      {
        id: 'req-5',
        roleName: 'Security Specialist',
        requiredSkills: ['Cybersecurity', 'Identity Management', 'Risk Assessment'],
        experienceLevel: 'senior',
        effortDays: 30,
        startDate: '2025-04-01',
        endDate: '2025-06-30',
      },
    ],
    totalBudget: 180000,
    status: 'draft',
    createdAt: '2025-01-18',
    createdBy: 'admin-1',
  },
];

// Mock assignments
export const mockAssignments: Assignment[] = [
  {
    id: 'assign-1',
    opportunityId: 'opp-6',
    resourceId: mockResources[15].id,
    startDate: '2025-02-01',
    endDate: '2025-05-31',
    actualEffort: 45,
    status: 'active',
    deliverables: ['Requirements Document', 'Process Maps', 'Gap Analysis Report'],
  },
  {
    id: 'assign-2',
    opportunityId: 'opp-3',
    resourceId: mockResources[5].id,
    startDate: '2025-02-15',
    endDate: '2025-06-30',
    actualEffort: 20,
    status: 'planned',
    deliverables: ['Design System', 'User Flows', 'Prototype'],
  },
];

// Mock users for authentication
export const mockUsers: User[] = [
  {
    id: 'admin-1',
    email: 'admin@gvts.com',
    fullName: 'Sarah Adeyemi',
    role: 'gvts_admin',
    organization: 'GVTS',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  {
    id: 'manager-1',
    email: 'manager@riby.com',
    fullName: 'Chidi Okonkwo',
    role: 'vgg_manager',
    organization: 'Riby',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chidi',
  },
  {
    id: 'pro-1',
    email: 'professional@vgg.com',
    fullName: 'Fatima Hassan',
    role: 'professional',
    organization: 'SystemSpecs',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
  },
];

// Analytics data
export const mockAnalyticsData: AnalyticsData = {
  utilizationRate: 72,
  totalResources: mockResources.length,
  availableResources: mockResources.filter(r => r.weeklyAvailability > 20).length,
  openOpportunities: mockOpportunities.filter(o => o.status === 'open').length,
  activeAssignments: mockAssignments.filter(a => a.status === 'active').length,
  totalRevenue: 2450000,
  totalCost: 1590000,
  averageMargin: 35,
  skillsGap: [
    { skill: 'Machine Learning', demand: 15, supply: 8 },
    { skill: 'Cloud Architecture', demand: 12, supply: 6 },
    { skill: 'Data Engineering', demand: 10, supply: 4 },
    { skill: 'Product Management', demand: 8, supply: 7 },
    { skill: 'UX Design', demand: 6, supply: 9 },
  ],
  utilizationTrend: [
    { month: 'Aug', rate: 65 },
    { month: 'Sep', rate: 68 },
    { month: 'Oct', rate: 71 },
    { month: 'Nov', rate: 69 },
    { month: 'Dec', rate: 74 },
    { month: 'Jan', rate: 72 },
  ],
  revenueVsCost: [
    { month: 'Aug', revenue: 380000, cost: 250000 },
    { month: 'Sep', revenue: 420000, cost: 275000 },
    { month: 'Oct', revenue: 395000, cost: 260000 },
    { month: 'Nov', revenue: 450000, cost: 290000 },
    { month: 'Dec', revenue: 410000, cost: 265000 },
    { month: 'Jan', revenue: 395000, cost: 250000 },
  ],
  tierDistribution: [
    { tier: 'Tier 1 - Core', count: mockResources.filter(r => r.tier === 1).length },
    { tier: 'Tier 2 - Trusted', count: mockResources.filter(r => r.tier === 2).length },
    { tier: 'Tier 3 - Proven', count: mockResources.filter(r => r.tier === 3).length },
    { tier: 'Tier 4 - Emerging', count: mockResources.filter(r => r.tier === 4).length },
  ],
  topSkills: [
    { skill: 'Python', count: 28 },
    { skill: 'Data Analysis', count: 25 },
    { skill: 'Project Management', count: 22 },
    { skill: 'JavaScript', count: 20 },
    { skill: 'SQL', count: 18 },
  ],
};

// Helper functions for display
export function getTierLabel(tier: Tier): string {
  const labels: Record<Tier, string> = {
    1: 'Core',
    2: 'Trusted',
    3: 'Proven',
    4: 'Emerging',
  };
  return labels[tier];
}

export function getTierDescription(tier: Tier): string {
  const descriptions: Record<Tier, string> = {
    1: 'Core GVTS & VGG Staff',
    2: 'Alumni & Trusted Associates',
    3: 'Proven External Resources',
    4: 'Known but Undeployed Talent',
  };
  return descriptions[tier];
}

export function getAvailabilityColor(hours: number): 'high' | 'medium' | 'low' {
  if (hours >= 30) return 'high';
  if (hours >= 15) return 'medium';
  return 'low';
}

export function getExperienceLevelLabel(level: ExperienceLevel): string {
  const labels: Record<ExperienceLevel, string> = {
    junior: 'Junior (1-3 years)',
    mid: 'Mid-level (3-6 years)',
    senior: 'Senior (6-10 years)',
    expert: 'Expert (10+ years)',
  };
  return labels[level];
}

export function getProficiencyLabel(proficiency: number): string {
  const labels: Record<number, string> = {
    1: 'Basic',
    2: 'Intermediate',
    3: 'Proficient',
    4: 'Advanced',
    5: 'Expert',
  };
  return labels[proficiency] || 'Unknown';
}
