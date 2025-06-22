
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, User, Settings, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const SecurityManagement = () => {
  const [securitySettings, setSecuritySettings] = useState({
    firewallEnabled: true,
    sshEnabled: true,
    bruteForceProtection: true,
    autoUpdates: true,
    ipWhitelisting: false
  });

  const [ipWhitelist, setIpWhitelist] = useState([
    '192.168.1.100',
    '203.0.113.0/24',
    '198.51.100.42'
  ]);

  const [newIP, setNewIP] = useState('');
  const { toast } = useToast();

  const handleToggleSetting = (setting: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
    toast({
      title: "Setting Updated",
      description: `${setting} has been ${securitySettings[setting as keyof typeof securitySettings] ? 'disabled' : 'enabled'}`
    });
  };

  const handleAddIP = () => {
    if (!newIP) return;
    setIpWhitelist([...ipWhitelist, newIP]);
    setNewIP('');
    toast({
      title: "IP Added",
      description: `${newIP} has been added to the whitelist`
    });
  };

  const handleRemoveIP = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter(item => item !== ip));
    toast({
      title: "IP Removed",
      description: `${ip} has been removed from the whitelist`
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Security Management</h2>
        <p className="text-gray-600">Configure security settings and access controls</p>
      </div>

      <Tabs defaultValue="firewall" className="space-y-4">
        <TabsList>
          <TabsTrigger value="firewall">Firewall</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="ssl">SSL/TLS</TabsTrigger>
          <TabsTrigger value="monitoring">Security Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="firewall" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Firewall Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="firewall">Firewall Protection</Label>
                  <p className="text-sm text-gray-600">Enable UFW firewall protection</p>
                </div>
                <Switch
                  id="firewall"
                  checked={securitySettings.firewallEnabled}
                  onCheckedChange={() => handleToggleSetting('firewallEnabled')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="brute-force">Brute Force Protection</Label>
                  <p className="text-sm text-gray-600">Block repeated failed login attempts</p>
                </div>
                <Switch
                  id="brute-force"
                  checked={securitySettings.bruteForceProtection}
                  onCheckedChange={() => handleToggleSetting('bruteForceProtection')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ssh">SSH Access</Label>
                  <p className="text-sm text-gray-600">Allow SSH connections to the server</p>
                </div>
                <Switch
                  id="ssh"
                  checked={securitySettings.sshEnabled}
                  onCheckedChange={() => handleToggleSetting('sshEnabled')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Firewall Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">SSH (Port 22)</p>
                    <p className="text-sm text-gray-600">Allow from anywhere</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">HTTP (Port 80)</p>
                    <p className="text-sm text-gray-600">Allow from anywhere</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">HTTPS (Port 443)</p>
                    <p className="text-sm text-gray-600">Allow from anywhere</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                IP Access Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="whitelist">IP Whitelisting</Label>
                  <p className="text-sm text-gray-600">Only allow access from specified IPs</p>
                </div>
                <Switch
                  id="whitelist"
                  checked={securitySettings.ipWhitelisting}
                  onCheckedChange={() => handleToggleSetting('ipWhitelisting')}
                />
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Enter IP address (e.g., 192.168.1.1)"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                />
                <Button onClick={handleAddIP}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {ipWhitelist.map((ip, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <span className="font-mono">{ip}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveIP(ip)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ssl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SSL/TLS Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">example.com</p>
                    <p className="text-sm text-gray-600">Expires: 2024-12-15</p>
                  </div>
                  <Badge>Valid</Badge>
                </div>
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">*.example.com</p>
                    <p className="text-sm text-gray-600">Expires: 2024-12-15</p>
                  </div>
                  <Badge>Valid</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-red-500 bg-red-50">
                  <p className="font-medium">Failed login attempt</p>
                  <p className="text-sm text-gray-600">IP: 203.0.113.42 - 2 minutes ago</p>
                </div>
                <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
                  <p className="font-medium">SSH connection from new IP</p>
                  <p className="text-sm text-gray-600">IP: 198.51.100.10 - 15 minutes ago</p>
                </div>
                <div className="p-3 border-l-4 border-green-500 bg-green-50">
                  <p className="font-medium">System update completed</p>
                  <p className="text-sm text-gray-600">Security patches installed - 1 hour ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
