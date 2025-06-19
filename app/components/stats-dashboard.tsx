
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  FileText, 
  FolderCheck, 
  Tag, 
  Calendar,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';
import { FileCategory } from '@/lib/types';

interface StatsData {
  totalFiles: number;
  categorizedFiles: number;
  organizedFiles: number;
  filesByCategory: Record<FileCategory, number>;
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getCategoryColor = (category: FileCategory) => {
    const colors = {
      [FileCategory.OPERATIONS]: 'bg-blue-500',
      [FileCategory.ESTIMATING]: 'bg-green-500',
      [FileCategory.ACCOUNTING]: 'bg-yellow-500',
      [FileCategory.FINANCE]: 'bg-purple-500',
      [FileCategory.MARKETING]: 'bg-pink-500',
      [FileCategory.OFFICE]: 'bg-gray-500',
      [FileCategory.UNCATEGORIZED]: 'bg-red-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const formatCategoryName = (category: string) => {
    return category.charAt(0) + category.slice(1).toLowerCase();
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

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-sm font-medium text-muted-foreground">Organized</p>
                <p className="text-3xl font-bold">{stats.organizedFiles.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {organizationRate.toFixed(1)}% of total
                </p>
              </div>
              <FolderCheck className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teams</p>
                <p className="text-3xl font-bold">{stats.teamStats.length}</p>
                {stats.lastScanDate && (
                  <p className="text-xs text-muted-foreground">
                    Last scan: {new Date(stats.lastScanDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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
