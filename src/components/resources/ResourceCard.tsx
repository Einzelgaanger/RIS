import { MapPin, Star, Clock, CheckCircle } from 'lucide-react';

import { getAvailabilityColor, getTierLabel } from '@/lib/domain';
import { Resource, Tier } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

  const topSkills = [...resource.skills].sort((a, b) => b.proficiency - a.proficiency).slice(0, compact ? 3 : 5);
  const feedback = [...resource.managerFeedback, ...resource.clientFeedback];
  const avgRating = feedback.length > 0 ? (feedback.reduce((acc, item) => acc + item.rating, 0) / feedback.length).toFixed(1) : null;

  return (
    <Card className={cn('card-interactive overflow-hidden', onClick && 'cursor-pointer')} onClick={onClick}>
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start gap-3">
          <Avatar className={cn('border-2 border-background shadow', compact ? 'h-10 w-10' : 'h-12 w-12')}>
            <AvatarImage src={resource.avatar} alt={resource.fullName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {resource.fullName.split(' ').map((name) => name[0]).join('')}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cn('truncate font-semibold', compact ? 'text-sm' : 'text-base')}>{resource.fullName}</h3>
              <TierBadge tier={resource.tier} />
            </div>

            {resource.title && <p className="truncate text-sm text-muted-foreground">{resource.title}</p>}

            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
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

        <div className="mt-3 flex flex-wrap gap-1.5">
          {topSkills.map((skill) => (
            <span key={skill.name} className={cn('skill-pill', skill.validated && 'skill-pill-validated')}>
              {skill.validated && <CheckCircle className="h-3 w-3" />}
              {skill.name}
            </span>
          ))}
          {resource.skills.length > topSkills.length && <span className="skill-pill bg-muted">+{resource.skills.length - topSkills.length}</span>}
        </div>

        {!compact && (
          <div className="mt-3 flex items-center gap-4 border-t pt-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Reliability:</span>
              <span className="font-medium">{resource.reliabilityScore}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Quality:</span>
              <span className="font-medium">{resource.qualityScore}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Experience:</span>
              <span className="font-medium">{resource.vggExperienceYears} yrs</span>
            </div>
          </div>
        )}

        {showPricing && (
          <div className="mt-3 flex items-center gap-4 border-t pt-3 text-xs">
            {canViewPricing('individual') && (
              <div>
                <span className="text-muted-foreground">Daily Rate: </span>
                <span className="font-semibold text-primary">${resource.pricing.individualDailyRate}</span>
              </div>
            )}
            {canViewPricing('release') && (
              <div>
                <span className="text-muted-foreground">Release Fee: </span>
                <span className="font-semibold">${resource.pricing.organizationReleaseFee}</span>
              </div>
            )}
            {canViewPricing('total') && (
              <div>
                <span className="text-muted-foreground">Total: </span>
                <span className="font-bold text-success">${resource.pricing.totalBillableRate}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
