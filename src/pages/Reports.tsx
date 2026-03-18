import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Download, FileText, ShieldCheck, Users } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useOpportunitiesQuery, useProposalsQuery, useResourcesQuery, useUserDirectoryQuery } from "@/hooks/use-backend-data";
import { supabase } from "@/integrations/supabase/client";
import { buildAnalytics } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { UserRole } from "@/types";

function csvEscape(value: unknown) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return false;

  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export default function Reports() {
  const { user, canViewAnalytics, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const resourcesQuery = useResourcesQuery();
  const opportunitiesQuery = useOpportunitiesQuery();
  const proposalsQuery = useProposalsQuery();
  const userDirectoryQuery = useUserDirectoryQuery();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const resources = resourcesQuery.data ?? [];
  const opportunities = opportunitiesQuery.data ?? [];
  const proposals = proposalsQuery.data ?? [];
  const users = userDirectoryQuery.data ?? [];
  const loading = resourcesQuery.isLoading || opportunitiesQuery.isLoading || proposalsQuery.isLoading || userDirectoryQuery.isLoading;

  const analytics = useMemo(() => buildAnalytics(resources, opportunities, proposals), [resources, opportunities, proposals]);

  const reportActions = useMemo(
    () => [
      {
        id: "resources",
        label: "Export resources CSV",
        description: "Skills, availability, rates, and organizations.",
        icon: Users,
        rows: resources.map((resource) => ({
          full_name: resource.fullName,
          title: resource.title || "",
          organization: resource.organization,
          country: resource.location.country,
          city: resource.location.city,
          weekly_availability: resource.weeklyAvailability,
          tier: resource.tier,
          top_skills: resource.skills.map((skill) => skill.name).join(" | "),
          daily_rate: resource.pricing.individualDailyRate,
          total_billable_rate: resource.pricing.totalBillableRate,
        })),
      },
      {
        id: "opportunities",
        label: "Export opportunities CSV",
        description: "Current pipeline, dates, and staffing demand.",
        icon: FileText,
        rows: opportunities.map((opportunity) => ({
          title: opportunity.title,
          client: opportunity.client || "",
          status: opportunity.status,
          location: opportunity.location || "",
          start_date: opportunity.start_date || "",
          end_date: opportunity.end_date || "",
          effort_days: opportunity.effort_days ?? 0,
          daily_rate: opportunity.daily_rate ?? 0,
          required_skills: opportunity.required_skills.join(" | "),
        })),
      },
      {
        id: "proposals",
        label: "Export proposals CSV",
        description: "All saved team plans and proposal statuses.",
        icon: BarChart3,
        rows: proposals.map((proposal) => ({
          title: proposal.title,
          client: proposal.client || "",
          status: proposal.status,
          builder_mode: proposal.builder_mode,
          linked_opportunity_id: proposal.linked_opportunity_id || "",
          created_at: proposal.created_at,
          total_budget: proposal.total_budget ?? 0,
        })),
      },
    ],
    [opportunities, proposals, resources],
  );

  const handleExport = (reportId: string) => {
    const report = reportActions.find((item) => item.id === reportId);
    if (!report) return;

    const ok = downloadCsv(`${report.id}-${new Date().toISOString().slice(0, 10)}.csv`, report.rows);
    if (!ok) {
      toast({ title: "Nothing to export", description: "This report will work as soon as live data exists." });
      return;
    }

    toast({ title: "Export ready", description: `${report.label} downloaded successfully.` });
  };

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    setUpdatingUserId(targetUserId);
    const { error } = await (supabase as any).rpc("set_user_role", {
      target_user_id: targetUserId,
      new_role: newRole,
    });
    setUpdatingUserId(null);

    if (error) {
      toast({ title: "Role update failed", description: error.message, variant: "destructive" });
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["user-directory"] }),
      queryClient.invalidateQueries({ queryKey: ["profiles"] }),
    ]);
    await refreshUser();
    toast({ title: "Role updated", description: "Access changes apply immediately." });
  };

  if (!canViewAnalytics()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & administration</h1>
        <p className="text-muted-foreground">Operational exports and role management for the live workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)
          : [
              { label: "Tracked resources", value: analytics.totalResources, icon: Users },
              { label: "Open opportunities", value: analytics.openOpportunities, icon: FileText },
              { label: "Saved proposals", value: proposals.length, icon: BarChart3 },
              { label: "Workspace users", value: users.length, icon: ShieldCheck },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="text-3xl font-bold">{item.value}</p>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {reportActions.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <report.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{report.label}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => handleExport(report.id)}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live reporting notes</CardTitle>
          <CardDescription>This page now uses current backend data only—no demo report history remains.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• Exports are generated from the current database state at download time.</p>
          <p>• Default authentication emails already work for signup confirmation and password reset.</p>
          <p>• Custom branded email templates can be added next once a workspace admin configures email-domain access.</p>
        </CardContent>
      </Card>

      {user?.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Access management</CardTitle>
            <CardDescription>Admins can assign manager and professional access without touching the backend manually.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Users will appear here after they create accounts.</p>
            ) : (
              users.map((member) => (
                <div key={member.userId} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{member.fullName}</p>
                      <Badge variant="outline">{member.role}</Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                    {member.organization && <p className="text-sm text-muted-foreground">{member.organization}</p>}
                  </div>
                  <div className="w-full sm:w-48">
                    <Select
                      value={member.role}
                      onValueChange={(value) => void handleRoleChange(member.userId, value as UserRole)}
                      disabled={member.userId === user.id || updatingUserId === member.userId}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
