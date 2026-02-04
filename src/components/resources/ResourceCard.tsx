import { Resource, Tier } from '@/types';
import { getTierLabel, getAvailabilityColor } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Star, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ResourceCardProps {
  resource: Resource;
  onClick?: () => void;
  showPricing?: boolean;
  compact?: boolean;
}

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={cn('tier-badge', `tier-${tier}`)}>
      {tier === 1 && <Star className="h-3 w-3" />}
      {getTierLabel(tier)}
    </span>
  );
}

export function AvailabilityBadge({ hours }: { hours: number }) {
  const color = getAvailabilityColor(hours);
  return (
    <span className={cn('availability-badge', `availability-${color}`)}>
      <Clock className="h-3 w-3" />
      {hours}h/week
    </span>
  );
}

export default function ResourceCard({ resource, onClick, showPricing = false, compact = false }: ResourceCardProps) {
  const { canViewPricing } = useAuth();
  
  const topSkills = resource.skills
    .sort((a, b) => b.proficiency - a.proficiency)
    .slice(0, compact ? 3 : 5);

  const avgRating = resource.managerFeedback.length > 0
    ? (resource.managerFeedback.reduce((acc, f) => acc + f.rating, 0) / resource.managerFeedback.length).toFixed(1)
    : null;

  return (
    <Card 
      className={cn(
        "card-interactive overflow-hidden",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start gap-3">
          <Avatar className={cn("border-2 border-background shadow", compact ? "h-10 w-10" : "h-12 w-12")}>
            <AvatarImage src={resource.avatar} alt={resource.fullName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {resource.fullName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn("font-semibold truncate", compact ? "text-sm" : "text-base")}>
                {resource.fullName}
              </h3>
              <TierBadge tier={resource.tier} />
            </div>
            
            {resource.title && (
              <p className="text-sm text-muted-foreground truncate">{resource.title}</p>
            )}
            
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {resource.location.city}, {resource.location.country}
              </span>
              {avgRating && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  {avgRating}
                </span>
              )}
            </div>
          </div>

          <AvailabilityBadge hours={resource.weeklyAvailability} />
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {topSkills.map((skill) => (
            <span 
              key={skill.name} 
              className={cn(
                "skill-pill",
                skill.validated && "skill-pill-validated"
              )}
            >
              {skill.validated && <CheckCircle className="h-3 w-3" />}
              {skill.name}
            </span>
          ))}
          {resource.skills.length > topSkills.length && (
            <span className="skill-pill bg-muted">
              +{resource.skills.length - topSkills.length}
            </span>
          )}
        </div>

        {/* Performance metrics */}
        {!compact && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Reliability:</span>
              <span className="font-medium">{resource.reliabilityScore}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Quality:</span>
              <span className="font-medium">{resource.qualityScore}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">VGG Exp:</span>
              <span className="font-medium">{resource.vggExperienceYears} yrs</span>
            </div>
          </div>
        )}

        {/* Pricing - role-based visibility */}
        {showPricing && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs">
            {canViewPricing('individual') && (
              <div>
                <span className="text-muted-foreground">Daily Rate: </span>
                <span className="font-semibold text-primary">
                  ${resource.pricing.individualDailyRate}
                </span>
              </div>
            )}
            {canViewPricing('release') && (
              <div>
                <span className="text-muted-foreground">Release Fee: </span>
                <span className="font-semibold">
                  ${resource.pricing.organizationReleaseFee}
                </span>
              </div>
            )}
            {canViewPricing('total') && (
              <div>
                <span className="text-muted-foreground">Total: </span>
                <span className="font-bold text-success">
                  ${resource.pricing.totalBillableRate}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
