import type { Tables } from "@/integrations/supabase/types";
import type { AnalyticsData, Resource, Skill, User, UserRole } from "@/types";

export type ProfileRow = Tables<"profiles">;
export type RoleRow = Tables<"user_roles">;
export type ResourceRow = Tables<"resources">;
export type OpportunityRow = Tables<"opportunities">;
export type ApplicationRow = Tables<"opportunity_applications">;
export type ProjectRow = Tables<"projects">;
export type ProposalRow = Tables<"proposals">;

const ROLE_PRIORITY: UserRole[] = ["admin", "manager", "professional"];

function parseArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function parseObject<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  return value && typeof value === "object" && !Array.isArray(value) ? ({ ...fallback, ...(value as T) } as T) : fallback;
}

export function getPrimaryRole(rows: Pick<RoleRow, "role">[] = []): UserRole {
  const roles = rows.map((row) => row.role as UserRole);
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? "professional";
}

export function getRoleLabel(role?: UserRole | null) {
  switch (role) {
    case "admin":
      return "Admin";
    case "manager":
      return "Manager";
    case "professional":
      return "Professional";
    default:
      return "User";
  }
}

export function normalizeUser(profile: ProfileRow | null, roles: Pick<RoleRow, "role">[] = []): User | null {
  if (!profile) return null;

  return {
    id: profile.user_id,
    email: profile.email,
    fullName: profile.full_name || profile.email.split("@")[0],
    role: getPrimaryRole(roles),
    organization: profile.organization || "",
    avatar: profile.avatar_url || undefined,
  };
}

export function getTierLabel(tier: number) {
  switch (tier) {
    case 1:
      return "Core";
    case 2:
      return "Specialist";
    case 3:
      return "Associate";
    default:
      return "Emerging";
  }
}

export function getAvailabilityColor(hours: number) {
  if (hours >= 30) return "high";
  if (hours >= 10) return "medium";
  return "low";
}

export function getExperienceLevelLabel(level?: string | null) {
  switch (level) {
    case "junior":
      return "Junior";
    case "mid":
      return "Mid-level";
    case "senior":
      return "Senior";
    case "expert":
      return "Expert";
    default:
      return "Not set";
  }
}

export function getProficiencyLabel(proficiency: number) {
  switch (proficiency) {
    case 5:
      return "Expert";
    case 4:
      return "Advanced";
    case 3:
      return "Proficient";
    case 2:
      return "Intermediate";
    default:
      return "Junior";
  }
}

function clampTier(value?: number | null): 1 | 2 | 3 | 4 {
  if (value === 1 || value === 2 || value === 3) return value;
  return 4;
}

function normalizeSkills(value: unknown): Skill[] {
  return parseArray<Record<string, unknown>>(value).map((skill) => ({
    name: typeof skill.name === "string" ? skill.name : "Unknown",
    proficiency: Math.min(5, Math.max(1, Number(skill.proficiency ?? 1))) as 1 | 2 | 3 | 4 | 5,
    yearsExperience: Number(skill.yearsExperience ?? skill.years_experience ?? 0),
    validated: Boolean(skill.validated),
    validatedBy: typeof skill.validatedBy === "string" ? skill.validatedBy : undefined,
  }));
}

export function normalizeResource(row: ResourceRow): Resource {
  const skills = normalizeSkills(row.skills);
  const pricing = parseObject(row.pricing, {
    individualDailyRate: 0,
    organizationReleaseFee: 0,
    gvtsMargin: 0,
    totalBillableRate: 0,
    currency: "USD",
  });

  const averageYears = skills.length
    ? Math.round(skills.reduce((sum, skill) => sum + skill.yearsExperience, 0) / skills.length)
    : 0;

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email || "",
    organization: row.organization || "",
    division: row.division || "",
    location: {
      country: row.country || "Unknown",
      city: row.city || "Unknown",
      remote: row.remote,
    },
    lineManager: row.line_manager || "",
    contractualStatus: (row.contractual_status as Resource["contractualStatus"]) || "contract",
    fteStatus: Number(row.fte_status ?? 0),
    tier: clampTier(row.tier),
    skills,
    vggExperienceYears: averageYears,
    certifications: parseArray(row.certifications),
    deliveryExamples: [],
    linkedProjects: [],
    aiBidReadySummary: row.ai_bid_ready_summary || "",
    clientReferences: [],
    managerFeedback: [],
    clientFeedback: [],
    reliabilityScore: Number(row.reliability_score ?? 0),
    qualityScore: Number(row.quality_score ?? 0),
    weeklyAvailability: Number(row.weekly_availability ?? 0),
    monthlyAvailability: Number(row.monthly_availability ?? 0),
    blackoutPeriods: [],
    currentAssignments: [],
    pricing: {
      individualDailyRate: Number(pricing.individualDailyRate ?? 0),
      organizationReleaseFee: Number(pricing.organizationReleaseFee ?? 0),
      gvtsMargin: Number(pricing.gvtsMargin ?? 0),
      totalBillableRate: Number(pricing.totalBillableRate ?? pricing.individualDailyRate ?? 0),
      currency: typeof pricing.currency === "string" ? pricing.currency : "USD",
    },
    profileCompleteness: Number(row.profile_completeness ?? 0),
    lastUpdated: row.updated_at,
    createdAt: row.created_at,
    title: row.title || undefined,
    avatar: undefined,
  };
}

export function buildAnalytics(resources: Resource[], opportunities: OpportunityRow[], proposals: ProposalRow[] = []): AnalyticsData {
  const totalResources = resources.length;
  const availableResources = resources.filter((resource) => resource.weeklyAvailability >= 20).length;
  const openOpportunities = opportunities.filter((opportunity) => opportunity.status === "open").length;
  const totalRevenue = resources.reduce((sum, resource) => sum + (resource.pricing.totalBillableRate || 0), 0);
  const totalCost = resources.reduce(
    (sum, resource) => sum + (resource.pricing.individualDailyRate + resource.pricing.organizationReleaseFee),
    0,
  );

  const utilizationRate = totalResources === 0 ? 0 : Math.round(((totalResources - availableResources) / totalResources) * 100);

  const skillSupply = new Map<string, number>();
  resources.forEach((resource) => {
    resource.skills.forEach((skill) => {
      skillSupply.set(skill.name, (skillSupply.get(skill.name) ?? 0) + 1);
    });
  });

  const skillDemand = new Map<string, number>();
  opportunities.forEach((opportunity) => {
    opportunity.required_skills.forEach((skill) => {
      skillDemand.set(skill, (skillDemand.get(skill) ?? 0) + 1);
    });
  });

  const skillsGap = Array.from(skillDemand.entries())
    .map(([skill, demand]) => ({ skill, demand, supply: skillSupply.get(skill) ?? 0 }))
    .sort((a, b) => b.demand - a.demand)
    .slice(0, 5);

  const topSkills = Array.from(skillSupply.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const tierDistribution = [1, 2, 3, 4].map((tier) => ({
    tier: `Tier ${tier} - ${getTierLabel(tier)}`,
    count: resources.filter((resource) => resource.tier === tier).length,
  }));

  return {
    utilizationRate,
    totalResources,
    availableResources,
    openOpportunities,
    activeAssignments: proposals.filter((proposal) => proposal.status === "in_progress").length,
    totalRevenue,
    totalCost,
    averageMargin: totalRevenue === 0 ? 0 : Math.round(((totalRevenue - totalCost) / totalRevenue) * 100),
    skillsGap,
    utilizationTrend: [],
    revenueVsCost: [],
    tierDistribution,
    topSkills,
  };
}
