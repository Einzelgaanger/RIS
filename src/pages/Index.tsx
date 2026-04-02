import { Link, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Shield,
  Target,
  Users,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

import heroImage from '@/assets/hero-team.jpg';
import patternBg from '@/assets/pattern-bg.jpg';
import vggLogo from '@/assets/vgg-logo.webp';

const features = [
  {
    icon: Users,
    title: 'Resource Pool Management',
    description:
      'Centralise your entire talent network with rich profiles, skills mapping, availability tracking, and tiered quality scores.',
  },
  {
    icon: Target,
    title: 'Intelligent Team Builder',
    description:
      'Match the right people to proposals automatically using AI-scored compatibility, skill gaps analysis, and cost modelling.',
  },
  {
    icon: Briefcase,
    title: 'Opportunity Pipeline',
    description:
      'Track live opportunities from discovery to delivery with role requirements, budgets, and application workflows.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reporting',
    description:
      'Real-time dashboards for utilisation rates, revenue forecasting, bench depth, and team performance metrics.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description:
      'Granular permissions for Admins, Managers, and Professionals — every user sees only what they need.',
  },
  {
    icon: Zap,
    title: 'Workspace Automation',
    description:
      'Invite team members, auto-assign roles, and onboard new hires with zero manual provisioning.',
  },
];

const stats = [
  { value: 'Live', label: 'Backend Data' },
  { value: 'RBAC', label: 'Role Security' },
  { value: 'AI', label: 'Team Matching' },
  { value: '24/7', label: 'Cloud Uptime' },
];

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <img src={vggLogo} alt="Venture Garden Group" className="h-8" />
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">
              Resource Intelligence Platform
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/login" className="gap-1.5">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="h-full w-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/88 to-background/75" />
        </div>
        <div className="absolute inset-0 bg-dot-grid opacity-[0.35] [mask-image:linear-gradient(to_bottom,white,transparent)]" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-xl lg:max-w-none">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]" />
                Production-ready platform
              </div>

              <h1 className="font-display text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.25rem] xl:text-6xl">
                Your entire talent operation,{' '}
                <span className="text-primary">one intelligent platform</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                GVTS Resource Intelligence Platform unifies resource management, proposal team building, and opportunity
                tracking — powered by live data and AI matching.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="gap-2 text-base">
                  <Link to="/login">
                    Launch Platform <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base">
                  <a href="#features">Explore capabilities</a>
                </Button>
              </div>

              <p className="mt-8 text-sm text-muted-foreground">
                Secure sign-in · Google OAuth · Role-based access
              </p>
            </div>

            {/* Product preview — decorative */}
            <div className="relative lg:justify-self-end">
              <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-3xl sm:-inset-6" aria-hidden />
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/95 p-6 shadow-xl shadow-foreground/5 backdrop-blur-sm sm:p-8">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/15" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Workspace overview</p>
                      <p className="text-[11px] text-muted-foreground">Live snapshot</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                    Live
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Utilisation', val: '87%' },
                    { label: 'Bench', val: '12' },
                    { label: 'Opps', val: '34' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border/60 bg-muted/40 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                      <p className="mt-1 font-display text-xl font-bold text-foreground">{item.val}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-2 rounded-xl border border-dashed border-border/70 bg-background/50 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Proposal team match</span>
                    <span className="font-semibold text-primary">94%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[94%] rounded-full bg-primary" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <div className="h-6 w-6 rounded-full bg-secondary/80" />
                    <div className="h-6 w-6 rounded-full bg-primary/40" />
                    <div className="h-6 w-6 rounded-full bg-muted-foreground/30" />
                    <span className="ml-auto text-[11px] text-muted-foreground">+5 members</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-card/60">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card px-4 py-8 text-center transition-colors hover:bg-muted/30 sm:px-6"
              >
                <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Capabilities</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to manage talent at scale
            </h2>
            <p className="mt-4 text-muted-foreground">
              From resource profiles to proposal assembly — every workflow lives in one secure, role-aware workspace.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md sm:p-8"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <img src={patternBg} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" width={1920} height={600} />
        <div className="absolute inset-0 bg-primary/85" />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
          <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to modernise your talent operations?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/85">
            Create an account in under a minute. The first user becomes Admin automatically — invite your team and start building
            proposals today.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="gap-2 text-base shadow-lg shadow-primary-foreground/10">
              <Link to="/login">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-border/60 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Enterprise-grade security',
                text: 'Row-level security, encrypted auth, and role-based access on every table.',
              },
              {
                title: 'Built for consulting firms',
                text: 'Designed for teams that staff proposals, track bench, and manage talent pools.',
              },
              {
                title: 'Cloud-native infrastructure',
                text: 'Auto-scaling backend, real-time data sync, and zero-downtime deployments.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-display font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 md:items-center lg:px-8">
          <div className="flex items-center gap-2">
            <img src={vggLogo} alt="Venture Garden Group" className="h-7" loading="lazy" />
            <span className="font-display text-sm font-bold">Resource Intelligence Platform</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground md:justify-center">
            <a href="#features" className="transition-colors hover:text-foreground">
              Capabilities
            </a>
            <Link to="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link to="/login" className="font-medium text-primary transition-colors hover:text-primary/90">
              Get started
            </Link>
          </div>
          <p className="text-xs text-muted-foreground md:text-right">
            &copy; {new Date().getFullYear()} Venture Garden Group. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
