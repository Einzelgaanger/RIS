import { Link } from 'react-router-dom';
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
import { ThemeToggle } from '@/components/ThemeToggle';
import heroImage from '@/assets/hero-team.jpg';
import patternBg from '@/assets/pattern-bg.jpg';
import faviconLogo from '/favicon.png';

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
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={faviconLogo} alt="GVTS" className="h-8 w-8" />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg font-bold tracking-tight">GVTS RIP</span>
              <span className="hidden text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:block">
                Resource Intelligence
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
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

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="h-full w-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50 dark:from-background dark:via-background/98 dark:to-background/70" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8 lg:py-44">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse-subtle" />
              Production-ready platform
            </div>

            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Your entire talent operation,{' '}
              <span className="text-primary">one intelligent platform</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              GVTS Resource Intelligence Platform unifies resource management, proposal
              team building, and opportunity tracking — powered by live data and AI matching.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="gap-2 text-base">
                <Link to="/login">
                  Launch Platform <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border/60 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="px-4 py-8 text-center sm:px-6">
              <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Capabilities</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to manage talent at scale
            </h2>
            <p className="mt-4 text-muted-foreground">
              From resource profiles to proposal assembly — every workflow lives in one secure, role-aware workspace.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-primary/20 hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Band ─── */}
      <section className="relative overflow-hidden">
        <img src={patternBg} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" width={1920} height={600} />
        <div className="absolute inset-0 bg-primary/85 dark:bg-primary/80" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:py-32">
          <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
            Ready to modernise your talent operations?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Create an account in under a minute. The first user becomes Admin automatically — invite your team and start building proposals today.
          </p>
          <div className="mt-10">
            <Button asChild size="lg" variant="secondary" className="gap-2 text-base">
              <Link to="/login">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Trust ─── */}
      <section className="border-t border-border/60 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { title: 'Enterprise-grade security', text: 'Row-level security, encrypted auth, and role-based access on every table.' },
              { title: 'Built for consulting firms', text: 'Designed for teams that staff proposals, track bench, and manage talent pools.' },
              { title: 'Cloud-native infrastructure', text: 'Auto-scaling backend, real-time data sync, and zero-downtime deployments.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/60 bg-card py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img src={faviconLogo} alt="GVTS" className="h-6 w-6" loading="lazy" />
            <span className="font-display text-sm font-bold">GVTS Resource Intelligence Platform</span>
          </div>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} GVTS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
