
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play, 
  Square,
  RotateCcw,
  Terminal,
  Database,
  Globe,
  Shield
} from 'lucide-react';
import { vpsManager, VPSConnection } from '@/lib/vpsManager';
import { installationManager, InstallationStep, InstallationConfig } from '@/lib/installationManager';

export const VPSConnectionManager = () => {
  const [connection, setConnection] = useState<VPSConnection>({
    host: '',
    username: 'root',
    password: '',
    port: 22
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [installationSteps, setInstallationSteps] = useState<InstallationStep[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    installationManager.onProgressUpdate(setInstallationSteps);
  }, []);

  const handleConnect = async () => {
    if (!connection.host || !connection.username) {
      setConnectionError('Please fill in all required fields');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');

    try {
      const success = await vpsManager.connect(connection);
      if (success) {
        setIsConnected(true);
        setConnectionError('');
      } else {
        setConnectionError('Failed to connect to VPS server');
      }
    } catch (error) {
      setConnectionError('Connection failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    vpsManager.disconnect();
    setIsConnected(false);
    setConnectionError('');
  };

  const startAutoInstallation = async () => {
    const config: InstallationConfig = {
      serverType: 'full',
      domain: 'example.com',
      email: 'admin@example.com',
      features: ['nginx', 'mysql', 'php', 'ssl', 'firewall'],
      applications: ['wordpress', 'phpmyadmin']
    };

    setIsInstalling(true);
    try {
      const success = await installationManager.startAutoInstallation(config);
      if (success) {
        console.log('Installation completed successfully');
      } else {
        console.log('Installation failed');
      }
    } catch (error) {
      console.error('Installation error:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">VPS Connection & Auto-Installation</h2>
        <p className="text-gray-600">Connect to your VPS and automatically install all required services</p>
      </div>

      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">VPS Connection</TabsTrigger>
          <TabsTrigger value="installation">Auto Installation</TabsTrigger>
          <TabsTrigger value="management">Server Management</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Server className="mr-2 h-5 w-5" />
                  VPS Connection
                </div>
                {isConnected && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionError && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {connectionError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="host">Server IP/Hostname *</Label>
                  <Input
                    id="host"
                    placeholder="192.168.1.100"
                    value={connection.host}
                    onChange={(e) => setConnection({...connection, host: e.target.value})}
                    disabled={isConnected}
                  />
                </div>
                <div>
                  <Label htmlFor="port">SSH Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={connection.port}
                    onChange={(e) => setConnection({...connection, port: parseInt(e.target.value) || 22})}
                    disabled={isConnected}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={connection.username}
                    onChange={(e) => setConnection({...connection, username: e.target.value})}
                    disabled={isConnected}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={connection.password}
                    onChange={(e) => setConnection({...connection, password: e.target.value})}
                    disabled={isConnected}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                {!isConnected ? (
                  <Button 
                    onClick={handleConnect} 
                    disabled={isConnecting}
                    className="flex items-center"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Server className="mr-2 h-4 w-4" />
                        Connect to VPS
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleDisconnect} variant="outline">
                    <XCircle className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Play className="mr-2 h-5 w-5" />
                  Automated Installation
                </div>
                {!isConnected && (
                  <Badge variant="secondary">
                    Connect to VPS first
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                This will automatically install and configure:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Nginx web server with SSL support</li>
                  <li>MySQL database server</li>
                  <li>PHP 8.x with required extensions</li>
                  <li>Redis cache server</li>
                  <li>Security tools (Fail2ban, UFW firewall)</li>
                  <li>WordPress CMS</li>
                  <li>phpMyAdmin database interface</li>
                  <li>HostPanel Pro control panel</li>
                </ul>
              </div>

              <Button 
                onClick={startAutoInstallation}
                disabled={!isConnected || isInstalling}
                className="w-full"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Auto Installation
                  </>
                )}
              </Button>

              {installationSteps.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="font-medium">Installation Progress</h4>
                  {installationSteps.map((step) => (
                    <div key={step.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{step.name}</span>
                        <div className="flex items-center space-x-2">
                          {step.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {step.status === 'failed' && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          {step.status === 'running' && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          )}
                          <Badge 
                            variant={
                              step.status === 'completed' ? 'default' :
                              step.status === 'failed' ? 'destructive' :
                              step.status === 'running' ? 'secondary' : 'outline'
                            }
                          >
                            {step.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                      <Progress value={step.progress} className="h-2" />
                      {step.output && (
                        <p className="text-xs text-green-600 mt-1">{step.output}</p>
                      )}
                      {step.error && (
                        <p className="text-xs text-red-600 mt-1">{step.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Terminal className="mr-2 h-4 w-4" />
                  Server Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" className="w-full" disabled={!isConnected}>
                  <RotateCcw className="mr-2 h-3 w-3" />
                  Restart Services
                </Button>
                <Button size="sm" variant="outline" className="w-full" disabled={!isConnected}>
                  <Square className="mr-2 h-3 w-3" />
                  Stop Services
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Database className="mr-2 h-4 w-4" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" className="w-full" disabled={!isConnected}>
                  Create Database
                </Button>
                <Button size="sm" variant="outline" className="w-full" disabled={!isConnected}>
                  Backup Databases
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Globe className="mr-2 h-4 w-4" />
                  Domains
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" className="w-full" disabled={!isConnected}>
                  Add Domain
                </Button>
                <Button size="sm" variant="outline" className="w-full" disabled={!isConnected}>
                  Install SSL
                </Button>
              </CardContent>
            </Card>
          </div>

          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="flex flex-col h-20">
                    <Database className="h-6 w-6 mb-1" />
                    <span className="text-xs">Install WordPress</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col h-20">
                    <Shield className="h-6 w-6 mb-1" />
                    <span className="text-xs">Security Scan</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col h-20">
                    <Server className="h-6 w-6 mb-1" />
                    <span className="text-xs">System Update</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col h-20">
                    <Terminal className="h-6 w-6 mb-1" />
                    <span className="text-xs">Open Terminal</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
