import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, MailX, XCircle } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Status = 'loading' | 'valid' | 'already' | 'invalid' | 'confirming' | 'done' | 'error';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid === true) setStatus('valid');
        else if (data.reason === 'already_unsubscribed') setStatus('already');
        else setStatus('invalid');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const handleConfirm = useCallback(async () => {
    if (!token) return;
    setStatus('confirming');
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsed.success) setStatus('done');
      else if (parsed.reason === 'already_unsubscribed') setStatus('already');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Validating your request…</p>
            </>
          )}

          {status === 'valid' && (
            <>
              <MailX className="h-12 w-12 text-warning" />
              <h1 className="text-xl font-bold">Unsubscribe</h1>
              <p className="text-muted-foreground">
                Click below to unsubscribe from app emails. You will still receive
                essential authentication emails.
              </p>
              <Button onClick={() => void handleConfirm()} className="mt-2 w-full">
                Confirm Unsubscribe
              </Button>
            </>
          )}

          {status === 'confirming' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Processing…</p>
            </>
          )}

          {status === 'done' && (
            <>
              <CheckCircle className="h-12 w-12 text-success" />
              <h1 className="text-xl font-bold">Unsubscribed</h1>
              <p className="text-muted-foreground">
                You've been successfully unsubscribed. You won't receive any more app
                emails from us.
              </p>
            </>
          )}

          {status === 'already' && (
            <>
              <CheckCircle className="h-12 w-12 text-muted-foreground" />
              <h1 className="text-xl font-bold">Already Unsubscribed</h1>
              <p className="text-muted-foreground">
                This email address has already been unsubscribed.
              </p>
            </>
          )}

          {status === 'invalid' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <h1 className="text-xl font-bold">Invalid Link</h1>
              <p className="text-muted-foreground">
                This unsubscribe link is invalid or has expired.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <h1 className="text-xl font-bold">Something Went Wrong</h1>
              <p className="text-muted-foreground">
                We couldn't process your request. Please try again later.
              </p>
            </>
          )}

          <Button asChild variant="ghost" size="sm" className="mt-2">
            <Link to="/">← Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
