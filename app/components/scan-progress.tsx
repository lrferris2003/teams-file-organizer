
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Scan, Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScanSession {
  id: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  filesFound: number;
  filesProcessed: number;
  errors?: string[];
}

export function ScanProgress() {
  const [scanSession, setScanSession] = useState<ScanSession | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const startScan = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start scan');
      }

      const data = await response.json();
      setScanSession(data);
      
      toast({
        title: "Scan Started",
        description: "File scanning has begun. This may take several minutes.",
      });

      // Start polling for updates
      pollScanStatus(data.sessionId);
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Failed to start file scanning",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const pollScanStatus = async (sessionId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/scan?sessionId=${sessionId}`);
        if (response.ok) {
          const session = await response.json();
          setScanSession(session);

          if (session.status === 'COMPLETED') {
            setIsScanning(false);
            toast({
              title: "Scan Completed",
              description: `Successfully processed ${session.filesProcessed} files`,
            });
          } else if (session.status === 'FAILED') {
            setIsScanning(false);
            toast({
              title: "Scan Failed",
              description: "File scanning encountered errors",
              variant: "destructive",
            });
          } else if (session.status === 'RUNNING') {
            // Continue polling
            setTimeout(poll, 2000);
          }
        }
      } catch (error) {
        console.error('Error polling scan status:', error);
        setTimeout(poll, 5000); // Retry after 5 seconds on error
      }
    };

    poll();
  };

  const getLatestScan = async () => {
    try {
      const response = await fetch('/api/scan');
      if (response.ok) {
        const session = await response.json();
        if (session) {
          setScanSession(session);
          if (session.status === 'RUNNING') {
            setIsScanning(true);
            pollScanStatus(session.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching latest scan:', error);
    }
  };

  useEffect(() => {
    getLatestScan();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Clock className="h-4 w-4 animate-pulse" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Scan className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const progress = scanSession && scanSession.filesFound > 0 
    ? (scanSession.filesProcessed / scanSession.filesFound) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          File Scanning
        </CardTitle>
        <CardDescription>
          Scan Microsoft Teams and SharePoint for files to organize
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {scanSession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={getStatusVariant(scanSession.status)} className="flex items-center gap-1">
                {getStatusIcon(scanSession.status)}
                {scanSession.status}
              </Badge>
              <div className="text-sm text-muted-foreground">
                {scanSession.filesProcessed} / {scanSession.filesFound} files
              </div>
            </div>

            {scanSession.status === 'RUNNING' && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <div className="text-sm text-muted-foreground text-center">
                  {progress.toFixed(1)}% complete
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Files Found</div>
                <div className="text-2xl font-bold text-blue-600">{scanSession.filesFound}</div>
              </div>
              <div>
                <div className="font-medium">Files Processed</div>
                <div className="text-2xl font-bold text-green-600">{scanSession.filesProcessed}</div>
              </div>
            </div>

            {scanSession.errors && scanSession.errors.length > 0 && (
              <div className="text-sm text-red-600">
                <div className="font-medium">Errors:</div>
                <div className="max-h-20 overflow-y-auto">
                  {scanSession.errors.slice(0, 3).map((error, index) => (
                    <div key={index} className="truncate">{error}</div>
                  ))}
                  {scanSession.errors.length > 3 && (
                    <div>... and {scanSession.errors.length - 3} more</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            No scan sessions found
          </div>
        )}

        <Button
          onClick={startScan}
          disabled={isScanning}
          className="w-full flex items-center gap-2"
        >
          {isScanning ? (
            <>
              <Clock className="h-4 w-4 animate-pulse" />
              Scanning...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start New Scan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
