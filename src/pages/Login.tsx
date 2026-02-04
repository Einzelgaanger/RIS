import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, ArrowRight, Sparkles, Users, Target, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import authHeroImage from '@/assets/auth-hero.jpg';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  const demoAccounts = [
    { email: 'admin@gvts.com', password: 'admin123', role: 'GVTS Admin', desc: 'Full platform access', color: 'from-primary to-blue-600', icon: Shield },
    { email: 'manager@riby.com', password: 'manager123', role: 'VGG Manager', desc: 'Team management', color: 'from-secondary to-orange-500', icon: Users },
    { email: 'professional@vgg.com', password: 'pro123', role: 'Professional', desc: 'Profile access', color: 'from-emerald-500 to-teal-500', icon: Target },
  ];

  const features = [
    { icon: Users, text: 'Access 500+ verified professionals' },
    { icon: Target, text: 'AI-powered team matching' },
    { icon: Sparkles, text: 'Intelligent resource analytics' },
    { icon: Shield, text: 'Enterprise-grade security' },
  ];

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background Image */}
        <img 
          src={authHeroImage} 
          alt="Resource Intelligence Network"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Gradient Overlay - reduced opacity */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/40 to-transparent" />
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div>
            <span className="font-display font-bold text-2xl">GVTS RIP</span>
            <p className="text-sm text-white/70">Resource Intelligence Platform</p>
          </div>

          {/* Main Content */}
          <div className="max-w-lg space-y-8">
            <div>
              <h1 className="font-display text-5xl xl:text-6xl font-bold leading-tight mb-4">
                Build winning teams in{' '}
                <span className="text-secondary">seconds</span>
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                The intelligent talent marketplace that transforms how you discover, 
                match, and deploy resources across the Venture Garden ecosystem.
              </p>
            </div>

            {/* Feature list */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-12">
            <div>
              <p className="font-display text-4xl font-bold">500+</p>
              <p className="text-sm text-white/70">Verified Professionals</p>
            </div>
            <div>
              <p className="font-display text-4xl font-bold">98%</p>
              <p className="text-sm text-white/70">Match Success Rate</p>
            </div>
            <div>
              <p className="font-display text-4xl font-bold">5min</p>
              <p className="text-sm text-white/70">Avg. Team Assembly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:px-10 xl:px-16 bg-background overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <span className="font-display font-bold text-xl">GVTS RIP</span>
            <p className="text-sm text-muted-foreground">Resource Intelligence Platform</p>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-2">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Sign in to access your dashboard and resources
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-slide-in-top">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 px-4 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 px-4 pr-12 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 font-semibold text-base gap-2 group" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">
                Quick access demo
              </span>
            </div>
          </div>

          {/* Demo accounts */}
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
                className="w-full group"
              >
                <div className={cn(
                  "relative p-3 rounded-xl border bg-card overflow-hidden",
                  "hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                )}>
                  {/* Gradient accent */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b",
                    account.color
                  )} />
                  
                  <div className="flex items-center gap-3 pl-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br",
                      account.color
                    )}>
                      <account.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {account.role}
                      </p>
                      <p className="text-xs text-muted-foreground">{account.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
