import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Mail, Shield, Sparkles } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import authHeroImage from '@/assets/auth-hero.jpg';

export default function Login() {
  const { login, signUp, signInWithGoogle, requestPasswordReset, isAuthenticated, isLoading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading authentication...
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    if (mode === 'signin') {
      const success = await login(email, password);
      if (!success) setError('Unable to sign in with those credentials.');
    } else {
      const result = await signUp({ email, password, fullName, organization });
      if (!result.success) setError(result.message || 'Unable to create account.');
      if (result.success) {
        setMessage(result.message || 'Account created.');
        setMode('signin');
      }
    }

    setSubmitting(false);
  };

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    const success = await signInWithGoogle();
    if (!success) setError('Google sign-in could not be started.');
    setSubmitting(false);
  };

  const handleForgotPassword = async () => {
    setError('');
    setMessage('');
    if (!email) {
      setError('Enter your email first, then request a reset link.');
      return;
    }
    const result = await requestPasswordReset(email);
    if (!result.success) setError(result.message || 'Could not send reset email.');
    if (result.success) setMessage(result.message || 'Reset email sent.');
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-3/5">
        <img src={authHeroImage} alt="GVTS Resource Intelligence Platform" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/35 to-background/10" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <p className="font-display text-2xl font-bold">GVTS RIP</p>
            <p className="text-sm text-primary-foreground/80">Production access for teams, managers, and delivery leads</p>
          </div>

          <div className="max-w-xl space-y-8">
            <div>
              <h1 className="font-display text-5xl font-bold leading-tight xl:text-6xl">
                Secure access to your <span className="text-secondary-foreground">live talent system</span>
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-primary-foreground/85">
                Sign in with Google or email/password to manage resources, opportunities, and proposal teams with real backend data.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-card/15 p-4 backdrop-blur-sm">
                <Shield className="mb-3 h-5 w-5" />
                <p className="text-sm font-medium">Role-based access</p>
              </div>
              <div className="rounded-xl bg-card/15 p-4 backdrop-blur-sm">
                <Sparkles className="mb-3 h-5 w-5" />
                <p className="text-sm font-medium">Live team planning</p>
              </div>
              <div className="rounded-xl bg-card/15 p-4 backdrop-blur-sm">
                <Mail className="mb-3 h-5 w-5" />
                <p className="text-sm font-medium">Verified accounts</p>
              </div>
            </div>
          </div>

          <div className="flex gap-10 text-sm text-primary-foreground/80">
            <div>
              <p className="text-3xl font-bold">Live</p>
              <p>backend data</p>
            </div>
            <div>
              <p className="text-3xl font-bold">Google</p>
              <p>managed OAuth</p>
            </div>
            <div>
              <p className="text-3xl font-bold">Email</p>
              <p>password sign-in</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-10 xl:px-16">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="font-display text-xl font-bold">GVTS RIP</p>
            <p className="text-sm text-muted-foreground">Production workspace sign-in</p>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h2>
            <p className="text-muted-foreground">
              {mode === 'signin'
                ? 'Access the live platform with your verified account.'
                : 'Create an account and verify your email to get started.'}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-lg bg-muted p-1">
            <button
              type="button"
              className={mode === 'signin' ? 'rounded-md bg-background px-3 py-2 text-sm font-medium shadow-sm' : 'px-3 py-2 text-sm text-muted-foreground'}
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'rounded-md bg-background px-3 py-2 text-sm font-medium shadow-sm' : 'px-3 py-2 text-sm text-muted-foreground'}
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </div>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">or use email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Jane Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input id="organization" value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="GVTS" />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === 'signin' && (
                    <button type="button" className="text-xs text-primary hover:underline" onClick={() => void handleForgotPassword()}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Working...
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign in' : 'Create account'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
