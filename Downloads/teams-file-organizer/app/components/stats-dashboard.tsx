
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  FileText, 
  FolderCheck, 
  Tag, 
  Calendar,
  TrendingUp,
  Users,
  Activity,
  Brain,
  Building2,
  Calculator,
  Briefcase,
  PiggyBank,
  Settings
} from 'lucide-react';
import { FileCategory, Department, DepartmentAnalytics } from '@/lib/types';

interface StatsData {
  totalFiles: number;
  categorizedFiles: number;
  organizedFiles: number;
  aiAnalyzedFiles: number;
  manualCategorizations: number;
  filesByCategory: Record<FileCategory, number>;
  filesByDepartment: Record<Department, number>;
  lastScanDate?: string;
  teamStats: Array<{
    id: string;
    displayName: string;
    _count: {
      files: number;
      channels: number;
    };
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
  }>;
}

export function StatsDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [departmentAnalytics, setDepartmentAnalytics] = useState<DepartmentAnalytics[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department>(Department.ALL_DEPARTMENTS);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDepartmentAnalytics = async () => {
    try {
      const url = selectedDepartment === Department.ALL_DEPARTMENTS 
        ? '/api/departments' 
        : `/api/departments?department=${selectedDepartment}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDepartmentAnalytics(Array.isArray(data) ? data : [data]);
      }
    } catch (error) {
      console.error('Error fetching department analytics:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchDepartmentAnalytics()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchDepartmentAnalytics();
    }
  }, [selectedDepartment]);

  const getCategoryColor = (category: FileCategory) => {
    const colors = {
      [FileCategory.OPERATIONS]: 'bg-blue-500',
      [FileCategory.ESTIMATING]: 'bg-green-500',
      [FileCategory.ACCOUNTING]: 'bg-yellow-500',
      [FileCategory.FINANCE]: 'bg-purple-500',
      [FileCategory.COMPANY_LAYOUT]: 'bg-pink-500',
      [FileCategory.OFFICE]: 'bg-gray-500',
      [FileCategory.UNCATEGORIZED]: 'bg-red-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const getDepartmentIcon = (department: Department) => {
    const icons = {
      [Department.OPERATIONS]: Building2,
      [Department.ESTIMATING]: Calculator,
      [Department.ACCOUNTING]: Briefcase,
      [Department.FINANCE]: PiggyBank,
      [Department.COMPANY_LAYOUT]: FileText,
      [Department.OFFICE]: Settings,
      [Department.ALL_DEPARTMENTS]: Users,
    };
    return icons[department] || Users;
  };

  const getDepartmentColor = (department: Department) => {
    const colors = {
      [Department.OPERATIONS]: 'text-blue-500',
      [Department.ESTIMATING]: 'text-green-500',
      [Department.ACCOUNTING]: 'text-yellow-500',
      [Department.FINANCE]: 'text-purple-500',
      [Department.COMPANY_LAYOUT]: 'text-pink-500',
      [Department.OFFICE]: 'text-gray-500',
      [Department.ALL_DEPARTMENTS]: 'text-orange-500',
    };
    return colors[department] || 'text-gray-500';
  };

  const formatCategoryName = (category: string) => {
    if (category === 'COMPANY_LAYOUT') return 'Company Layout';
    return category.charAt(0) + category.slice(1).toLowerCase();
  };

  const formatDepartmentName = (department: string) => {
    if (department === 'ALL_DEPARTMENTS') return 'All Departments';
    if (department === 'COMPANY_LAYOUT') return 'Company Layout';
    return department.charAt(0) + department.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Failed to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  const categorizationRate = stats.totalFiles > 0 
    ? (stats.categorizedFiles / stats.totalFiles) * 100 
    : 0;

  const organizationRate = stats.totalFiles > 0 
    ? (stats.organizedFiles / stats.totalFiles) * 100 
    : 0;

  const aiAnalysisRate = stats.totalFiles > 0 
    ? (stats.aiAnalyzedFiles / stats.totalFiles) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Department Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Department Analytics</CardTitle>
              <CardDescription>View analytics by department or across all departments</CardDescription>
            </div>
            <Select value={selectedDepartment} onValueChange={(value) => setSelectedDepartment(value as Department)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Department).map((dept) => {
                  const Icon = getDepartmentIcon(dept);
                  return (
                    <SelectItem key={dept} value={dept}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${getDepartmentColor(dept)}`} />
                        {formatDepartmentName(dept)}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-3xl font-bold">{stats.totalFiles.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categorized</p>
                <p className="text-3xl font-bold">{stats.categorizedFiles.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {categorizationRate.toFixed(1)}% of total
                </p>
              </div>
              <Tag className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Analyzed</p>
                <p className="text-3xl font-bold">{stats.aiAnalyzedFiles?.toLocaleString() || '0'}</p>
                <p className="text-xs text-muted-foreground">
                  {aiAnalysisRate.toFixed(1)}% of total
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manual Categorizations</p>
                <p className="text-3xl font-bold">{stats.manualCategorizations?.toLocaleString() || '0'}</p>
                <p className="text-xs text-muted-foreground">User corrections</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organized</p>
                <p className="text-3xl font-bold">{stats.organizedFiles.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {organizationRate.toFixed(1)}% of total
                </p>
              </div>
              <FolderCheck className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Analytics */}
      {departmentAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedDepartment === Department.ALL_DEPARTMENTS 
                ? 'All Departments Overview' 
                : `${formatDepartmentName(selectedDepartment)} Department`
              }
            </CardTitle>
            <CardDescription>
              {selectedDepartment === Department.ALL_DEPARTMENTS 
                ? 'Analytics across all departments' 
                : 'Department-specific file organization analytics'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {departmentAnalytics.map((dept) => {
                const Icon = getDepartmentIcon(dept.department);
                return (
                  <div key={dept.department} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${getDepartmentColor(dept.department)}`} />
                      <span className="font-medium">{formatDepartmentName(dept.department)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Files</span>
                        <span className="font-medium">{dept.totalFiles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Categorized</span>
                        <span className="font-medium">{dept.categorizedFiles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Recent Activity</span>
                        <span className="font-medium">{dept.recentActivity}</span>
                      </div>
                    </div>
                    {dept.topKeywords.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Top Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {dept.topKeywords.slice(0, 3).map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Files by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Files by Category
            </CardTitle>
            <CardDescription>Distribution of files across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.filesByCategory)
                .sort(([,a], [,b]) => b - a)
                .map(([category, count]) => {
                  const percentage = stats.totalFiles > 0 ? (count / stats.totalFiles) * 100 : 0;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(category as FileCategory)}`}></div>
                          <span className="text-sm font-medium">
                            {formatCategoryName(category)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {count} ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getCategoryColor(category as FileCategory)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Team Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Statistics
            </CardTitle>
            <CardDescription>Files and channels per team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.teamStats
                .sort((a, b) => b._count.files - a._count.files)
                .slice(0, 5)
                .map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium truncate">{team.displayName}</div>
                      <div className="text-sm text-muted-foreground">
                        {team._count.channels} channels
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {team._count.files} files
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest file organization activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{activity.action.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No recent activity
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
