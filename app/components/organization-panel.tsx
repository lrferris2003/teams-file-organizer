
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FolderTree, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrganizationPanelProps {
  selectedFiles: string[];
  onOrganizationComplete?: () => void;
}

interface Team {
  id: string;
  displayName: string;
  teamId: string;
}

export function OrganizationPanel({ selectedFiles, onOrganizationComplete }: OrganizationPanelProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizationResults, setOrganizationResults] = useState<any>(null);
  const { toast } = useToast();

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleOrganize = async () => {
    if (!selectedTeam || selectedFiles.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select files and a target team",
        variant: "destructive",
      });
      return;
    }

    setIsOrganizing(true);
    try {
      const response = await fetch('/api/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: selectedFiles,
          targetTeamId: selectedTeam,
        }),
      });

      if (response.ok) {
        const results = await response.json();
        setOrganizationResults(results);
        
        toast({
          title: "Organization Complete",
          description: `Successfully organized ${results.summary.successful} of ${results.summary.total} files`,
        });

        onOrganizationComplete?.();
      } else {
        throw new Error('Failed to organize files');
      }
    } catch (error) {
      toast({
        title: "Organization Failed",
        description: "Failed to organize files",
        variant: "destructive",
      });
    } finally {
      setIsOrganizing(false);
    }
  };

  // Fetch teams when component mounts
  React.useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderTree className="h-5 w-5" />
          File Organization
        </CardTitle>
        <CardDescription>
          Organize selected files into structured folders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Summary */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Package className="h-4 w-4" />
          <span className="font-medium">{selectedFiles.length} files selected</span>
        </div>

        {/* Target Team Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Team</label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team for organization" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Organization Structure Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Organization Structure</label>
          <div className="text-sm text-muted-foreground space-y-1 p-3 bg-muted rounded-lg">
            <div>📁 Team Root</div>
            <div className="ml-4">📁 Organized_Operations</div>
            <div className="ml-4">📁 Organized_Estimating</div>
            <div className="ml-4">📁 Organized_Accounting</div>
            <div className="ml-4">📁 Organized_Finance</div>
            <div className="ml-4">📁 Organized_Marketing</div>
            <div className="ml-4">📁 Organized_Office</div>
            <div className="ml-4">📁 Organized_Uncategorized</div>
          </div>
        </div>

        {/* Organization Results */}
        {organizationResults && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">Organization Results</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {organizationResults.summary.successful}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {organizationResults.summary.failed}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {organizationResults.summary.total}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            {organizationResults.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Errors</span>
                </div>
                <div className="text-sm text-red-600 max-h-32 overflow-y-auto">
                  {organizationResults.errors.slice(0, 5).map((error: string, index: number) => (
                    <div key={index} className="truncate">{error}</div>
                  ))}
                  {organizationResults.errors.length > 5 && (
                    <div>... and {organizationResults.errors.length - 5} more</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleOrganize}
          disabled={isOrganizing || selectedFiles.length === 0 || !selectedTeam}
          className="w-full"
        >
          {isOrganizing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Organizing Files...
            </>
          ) : (
            <>
              <FolderTree className="h-4 w-4 mr-2" />
              Organize {selectedFiles.length} Files
            </>
          )}
        </Button>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground">
          Files will be copied to organized folders in the selected team's SharePoint site. 
          Original files will remain in their current locations.
        </div>
      </CardContent>
    </Card>
  );
}
