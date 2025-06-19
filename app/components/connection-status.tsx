
'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConnectionStatusProps {
  onConnect?: () => void;
}

export function ConnectionStatus({ onConnect }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/teams');
      setIsConnected(response.ok);
      return response.ok;
    } catch (error) {
      setIsConnected(false);
      return false;
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const connected = await checkConnection();
      if (connected) {
        toast({
          title: "Connected",
          description: "Successfully connected to Microsoft Teams",
        });
        onConnect?.();
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Microsoft Teams. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to Microsoft Teams",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="flex items-center gap-3">
      <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            Connected
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Disconnected
          </>
        )}
      </Badge>
      
      {!isConnected && (
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          size="sm"
          className="flex items-center gap-2"
        >
          {isConnecting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect to Teams'
          )}
        </Button>
      )}
    </div>
  );
}
