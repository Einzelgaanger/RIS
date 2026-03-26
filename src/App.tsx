import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Resources from "@/pages/Resources";
import TeamBuilder from "@/pages/TeamBuilder";
import Opportunities from "@/pages/Opportunities";
import Analytics from "@/pages/Analytics";
import Reports from "@/pages/Reports";
import WorkspaceSetup from "@/pages/WorkspaceSetup";
import MyProfile from "@/pages/MyProfile";
import NotFound from "@/pages/NotFound";
import Unsubscribe from "@/pages/Unsubscribe";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route element={<AppLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="resources" element={<Resources />} />
                <Route path="team-builder" element={<TeamBuilder />} />
                <Route path="opportunities" element={<Opportunities />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="reports" element={<Reports />} />
                <Route path="workspace" element={<WorkspaceSetup />} />
                <Route path="profile" element={<MyProfile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
