import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import vggLogo from "@/assets/vgg-logo.webp";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-dot-grid px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-transparent to-muted/40" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <img src={vggLogo} alt="Venture Garden Group" className="h-8" />
        </div>
        <Card className="border-border/70 text-center shadow-xl shadow-primary/5">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Page not found</CardTitle>
            <CardDescription>
              We couldn&apos;t find <span className="font-mono text-foreground/80">{location.pathname}</span>. Check the URL or return
              home.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to="/" className="gap-2">
                <Home className="h-4 w-4" />
                Back to home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
