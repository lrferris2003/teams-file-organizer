
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectionStatus } from '@/components/connection-status';
import { ScanProgress } from '@/components/scan-progress';
import { FileBrowser } from '@/components/file-browser';
import { OrganizationPanel } from '@/components/organization-panel';
import { StatsDashboard } from '@/components/stats-dashboard';
import { 
  FileText, 
  FolderTree, 
  BarChart3, 
  Settings,
  Zap,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleFilesSelected = (fileIds: string[]) => {
    setSelectedFiles(fileIds);
  };

  const handleOrganizationComplete = () => {
    // Refresh file browser and switch to dashboard
    setSelectedFiles([]);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FolderTree className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Teams File Organizer</h1>
                  <p className="text-sm text-gray-600">WSJ Enterprises, LLC</p>
                </div>
              </div>
            </div>
            <ConnectionStatus />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Organize Your Microsoft Teams Files
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Automatically scan, categorize, and organize files across all your Teams and SharePoint sites. 
            Keep your company files structured and easily accessible.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Intelligent Scanning</h3>
              <p className="text-sm text-gray-600">
                Automatically discover and analyze files across all Teams and channels
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Categorization</h3>
              <p className="text-sm text-gray-600">
                AI-powered categorization into Operations, Finance, Marketing, and more
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Automated Organization</h3>
              <p className="text-sm text-gray-600">
                Organize files into structured folders while preserving originals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Scan Files
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Browse Files
            </TabsTrigger>
            <TabsTrigger value="organize" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Organize
              {selectedFiles.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedFiles.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <StatsDashboard />
          </TabsContent>

          <TabsContent value="scan" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScanProgress />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Scan Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure how files are scanned and categorized
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Expected Teams</div>
                        <div className="text-sm text-muted-foreground">
                          WSJ Office, WSJ Enterprises LLC, WSJ - Estimating, WSJ - Operations
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Categories</div>
                        <div className="text-sm text-muted-foreground">
                          Operations, Estimating, Accounting, Finance, Marketing, Office
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">File Types</div>
                        <div className="text-sm text-muted-foreground">
                          Documents, Spreadsheets, PDFs, Images, and more
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            <FileBrowser onFilesSelected={handleFilesSelected} />
          </TabsContent>

          <TabsContent value="organize" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FileBrowser onFilesSelected={handleFilesSelected} />
              </div>
              <div>
                <OrganizationPanel 
                  selectedFiles={selectedFiles}
                  onOrganizationComplete={handleOrganizationComplete}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              © 2025 WSJ Enterprises, LLC. Microsoft Teams File Organizer.
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Powered by Microsoft Graph API</span>
              <Badge variant="outline">v1.0.0</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
