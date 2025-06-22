
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wifi, Server, Settings, Plus, Trash2, Network } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const NetworkManagement = () => {
  const [networkInterfaces, setNetworkInterfaces] = useState([
    { name: 'eth0', ip: '192.168.1.100', netmask: '255.255.255.0', gateway: '192.168.1.1', status: 'up' },
    { name: 'lo', ip: '127.0.0.1', netmask: '255.0.0.0', gateway: '-', status: 'up' }
  ]);

  const [dnsSettings, setDnsSettings] = useState({
    primary: '8.8.8.8',
    secondary: '8.8.4.4',
    domain: 'example.com'
  });

  const [firewallRules, setFirewallRules] = useState([
    { id: 1, port: '22', protocol: 'TCP', source: 'any', action: 'ALLOW', description: 'SSH' },
    { id: 2, port: '80', protocol: 'TCP', source: 'any', action: 'ALLOW', description: 'HTTP' },
    { id: 3, port: '443', protocol: 'TCP', source: 'any', action: 'ALLOW', description: 'HTTPS' },
  ]);

  const [newRule, setNewRule] = useState({
    port: '',
    protocol: 'TCP',
    source: 'any',
    action: 'ALLOW',
    description: ''
  });

  const { toast } = useToast();

  const handleAddFirewallRule = () => {
    if (!newRule.port || !newRule.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const rule = {
      id: firewallRules.length + 1,
      ...newRule
    };

    setFirewallRules([...firewallRules, rule]);
    setNewRule({ port: '', protocol: 'TCP', source: 'any', action: 'ALLOW', description: '' });
    toast({
      title: "Rule Added",
      description: `Firewall rule for port ${newRule.port} has been added`
    });
  };

  const handleDeleteRule = (id: number) => {
    setFirewallRules(firewallRules.filter(rule => rule.id !== id));
    toast({
      title: "Rule Deleted",
      description: "Firewall rule has been removed"
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Network Management</h2>
        <p className="text-gray-600">Configure network interfaces, DNS, and firewall settings</p>
      </div>

      {/* Network Interfaces */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Network className="mr-2 h-5 w-5" />
            Network Interfaces
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {networkInterfaces.map((interface_, index) => (
              <div key={index} className="flex justify-between items-center p-4 border rounded">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                  <div>
                    <p className="font-medium">{interface_.name}</p>
                    <Badge variant={interface_.status === 'up' ? 'default' : 'destructive'}>
                      {interface_.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">IP Address</p>
                    <p className="font-medium">{interface_.ip}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Netmask</p>
                    <p className="font-medium">{interface_.netmask}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gateway</p>
                    <p className="font-medium">{interface_.gateway}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DNS Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="mr-2 h-5 w-5" />
            DNS Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="primary-dns">Primary DNS</Label>
              <Input
                id="primary-dns"
                value={dnsSettings.primary}
                onChange={(e) => setDnsSettings({...dnsSettings, primary: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="secondary-dns">Secondary DNS</Label>
              <Input
                id="secondary-dns"
                value={dnsSettings.secondary}
                onChange={(e) => setDnsSettings({...dnsSettings, secondary: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={dnsSettings.domain}
                onChange={(e) => setDnsSettings({...dnsSettings, domain: e.target.value})}
              />
            </div>
          </div>
          <Button className="mt-4">Save DNS Settings</Button>
        </CardContent>
      </Card>

      {/* Firewall Rules */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Wifi className="mr-2 h-5 w-5" />
              Firewall Rules
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Add Firewall Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        placeholder="80"
                        value={newRule.port}
                        onChange={(e) => setNewRule({...newRule, port: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="protocol">Protocol</Label>
                      <Select value={newRule.protocol} onValueChange={(value) => setNewRule({...newRule, protocol: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="TCP">TCP</SelectItem>
                          <SelectItem value="UDP">UDP</SelectItem>
                          <SelectItem value="ICMP">ICMP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="source">Source</Label>
                      <Input
                        id="source"
                        placeholder="any or IP address"
                        value={newRule.source}
                        onChange={(e) => setNewRule({...newRule, source: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="action">Action</Label>
                      <Select value={newRule.action} onValueChange={(value) => setNewRule({...newRule, action: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="ALLOW">ALLOW</SelectItem>
                          <SelectItem value="DENY">DENY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Rule description"
                      value={newRule.description}
                      onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleAddFirewallRule} className="w-full">
                    Add Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {firewallRules.map((rule) => (
              <div key={rule.id} className="flex justify-between items-center p-3 border rounded">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
                  <div>
                    <p className="font-medium">{rule.description}</p>
                    <p className="text-sm text-gray-600">Port {rule.port}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Protocol</p>
                    <p className="font-medium">{rule.protocol}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Source</p>
                    <p className="font-medium">{rule.source}</p>
                  </div>
                  <div>
                    <Badge variant={rule.action === 'ALLOW' ? 'default' : 'destructive'}>
                      {rule.action}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Connections</span>
                <span className="text-sm font-medium">234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Listening Ports</span>
                <span className="text-sm font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Failed Connections</span>
                <span className="text-sm font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bandwidth Usage</span>
                <span className="text-sm font-medium">1.2 GB/day</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Port Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Port 22 (SSH)</span>
                <Badge>Open</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Port 80 (HTTP)</span>
                <Badge>Open</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Port 443 (HTTPS)</span>
                <Badge>Open</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Port 3306 (MySQL)</span>
                <Badge variant="secondary">Filtered</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
