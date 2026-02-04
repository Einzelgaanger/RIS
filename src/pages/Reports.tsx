import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { mockAnalyticsData, mockResources } from '@/data/mockData';
import { Report, ReportType } from '@/types';
import {
  FileText, Download, Calendar, Filter, Search, BarChart3,
  Users, DollarSign, Target, TrendingUp, Clock, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const reportTemplates = [
  {
    id: 'utilization',
    name: 'Utilization Report',
    description: 'Resource utilization rates by individual, team, and organization',
    type: 'utilization' as ReportType,
    icon: Users,
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'financial',
    name: 'Financial Summary',
    description: 'Revenue, cost, and margin analysis across all projects',
    type: 'financial' as ReportType,
    icon: DollarSign,
    color: 'bg-success/10 text-success',
  },
  {
    id: 'skills',
    name: 'Skills Gap Analysis',
    description: 'Compare required skills against available resource pool',
    type: 'skills' as ReportType,
    icon: Target,
    color: 'bg-warning/10 text-warning',
  },
  {
    id: 'performance',
    name: 'Performance Review',
    description: 'Client satisfaction scores and delivery outcomes',
    type: 'performance' as ReportType,
    icon: TrendingUp,
    color: 'bg-secondary/10 text-secondary',
  },
];

const recentReports: Report[] = [
  {
    id: 'rep-1',
    name: 'Q4 2024 Utilization Report',
    type: 'utilization',
    description: 'Quarterly utilization analysis',
    generatedAt: '2025-01-15T10:30:00Z',
    generatedBy: 'admin-1',
  },
  {
    id: 'rep-2',
    name: 'December Financial Summary',
    type: 'financial',
    description: 'Monthly financial report',
    generatedAt: '2025-01-05T14:20:00Z',
    generatedBy: 'admin-1',
  },
  {
    id: 'rep-3',
    name: 'Skills Assessment 2024',
    type: 'skills',
    description: 'Annual skills gap analysis',
    generatedAt: '2024-12-20T09:00:00Z',
    generatedBy: 'admin-1',
  },
];

export default function Reports() {
  const { user, canViewAnalytics } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof reportTemplates[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!canViewAnalytics()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setSelectedTemplate(null);
    
    toast({
      title: 'Report generated',
      description: `${selectedTemplate.name} has been generated and is ready for download.`,
    });
  };

  const handleDownloadReport = (report: Report) => {
    toast({
      title: 'Download started',
      description: `Downloading ${report.name}...`,
    });
  };

  const filteredReports = recentReports.filter(report => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!report.name.toLowerCase().includes(query)) return false;
    }
    if (typeFilter !== 'all' && report.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download platform reports
        </p>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Generate New Report</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reportTemplates.map((template) => (
            <Card 
              key={template.id}
              className="card-interactive"
              onClick={() => setSelectedTemplate(template)}
            >
              <CardContent className="p-6">
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", template.color)}>
                  <template.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Reports</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ReportType | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="utilization">Utilization</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="skills">Skills</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredReports.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reports found</p>
                </div>
              ) : (
                filteredReports.map((report) => {
                  const template = reportTemplates.find(t => t.type === report.type);
                  return (
                    <div key={report.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", template?.color)}>
                        {template && <template.icon className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="capitalize">
                          {report.type}
                        </Badge>
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(report.generatedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(report.generatedAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentReports.length}</p>
                <p className="text-sm text-muted-foreground">Reports Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Report Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <BarChart3 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockResources.length}</p>
                <p className="text-sm text-muted-foreground">Data Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Report Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent>
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>Generate {selectedTemplate.name}</DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center mx-auto", selectedTemplate.color)}>
                  <selectedTemplate.icon className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    This report will include data from the last 6 months and can be exported as PDF or CSV.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Date Range</p>
                    <p className="font-medium">Last 6 months</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Format</p>
                    <p className="font-medium">PDF & CSV</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateReport} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
