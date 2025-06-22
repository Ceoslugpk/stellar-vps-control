
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Trash2, Server, Globe, Shield, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Domain {
  id: number;
  name: string;
  status: 'active' | 'suspended' | 'pending';
  ssl: boolean;
  expires: string;
  registrar: string;
  subdomains: string[];
  traffic: {
    visitors: number;
    pageviews: number;
  };
  dns: {
    a: string;
    cname: string[];
    mx: string[];
  };
}

export const DomainManagement = () => {
  const [domains, setDomains] = useState<Domain[]>([
    { 
      id: 1, 
      name: 'example.com', 
      status: 'active', 
      ssl: true, 
      expires: '2024-12-15',
      registrar: 'NameCheap',
      subdomains: ['www', 'mail', 'ftp', 'cpanel'],
      traffic: { visitors: 1250, pageviews: 3420 },
      dns: {
        a: '192.168.1.100',
        cname: ['www.example.com'],
        mx: ['mail.example.com']
      }
    },
    { 
      id: 2, 
      name: 'testsite.org', 
      status: 'active', 
      ssl: false, 
      expires: '2025-03-20',
      registrar: 'GoDaddy',
      subdomains: ['www', 'blog'],
      traffic: { visitors: 450, pageviews: 890 },
      dns: {
        a: '192.168.1.101',
        cname: ['www.testsite.org'],
        mx: ['mail.testsite.org']
      }
    },
    { 
      id: 3, 
      name: 'myapp.net', 
      status: 'pending', 
      ssl: true, 
      expires: '2024-08-10',
      registrar: 'Cloudflare',
      subdomains: ['api', 'cdn'],
      traffic: { visitors: 2100, pageviews: 8750 },
      dns: {
        a: '192.168.1.102',
        cname: ['api.myapp.net', 'cdn.myapp.net'],
        mx: ['mail.myapp.net']
      }
    },
  ]);

  const [newDomain, setNewDomain] = useState({
    name: '',
    documentRoot: '/var/www/html',
    phpVersion: '8.1',
    enableSSL: true
  });

  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const { toast } = useToast();

  // Simulate real-time traffic updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDomains(prevDomains => 
        prevDomains.map(domain => ({
          ...domain,
          traffic: {
            visitors: domain.traffic.visitors + Math.floor(Math.random() * 10),
            pageviews: domain.traffic.pageviews + Math.floor(Math.random() * 25)
          }
        }))
      );
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleAddDomain = () => {
    if (!newDomain.name) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive"
      });
      return;
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain.name)) {
      toast({
        title: "Error",
        description: "Please enter a valid domain name",
        variant: "destructive"
      });
      return;
    }

    const domain: Domain = {
      id: domains.length + 1,
      name: newDomain.name,
      status: 'pending',
      ssl: newDomain.enableSSL,
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      registrar: 'Manual Entry',
      subdomains: ['www'],
      traffic: { visitors: 0, pageviews: 0 },
      dns: {
        a: '192.168.1.' + (100 + domains.length),
        cname: [`www.${newDomain.name}`],
        mx: [`mail.${newDomain.name}`]
      }
    };

    setDomains([...domains, domain]);
    setNewDomain({ name: '', documentRoot: '/var/www/html', phpVersion: '8.1', enableSSL: true });
    
    toast({
      title: "Success",
      description: `Domain ${newDomain.name} has been added and is being configured`,
    });

    // Simulate domain activation
    setTimeout(() => {
      setDomains(prev => prev.map(d => 
        d.id === domain.id ? { ...d, status: 'active' as const } : d
      ));
      toast({
        title: "Domain Active",
        description: `${domain.name} is now active and ready to use`,
      });
    }, 3000);
  };

  const handleDeleteDomain = (id: number) => {
    const domain = domains.find(d => d.id === id);
    setDomains(domains.filter(domain => domain.id !== id));
    toast({
      title: "Domain Deleted",
      description: `${domain?.name} has been removed from the server`,
    });
  };

  const handleSSLToggle = (id: number) => {
    setDomains(prev => prev.map(domain => 
      domain.id === id ? { ...domain, ssl: !domain.ssl } : domain
    ));
    const domain = domains.find(d => d.id === id);
    toast({
      title: domain?.ssl ? "SSL Disabled" : "SSL Enabled",
      description: `SSL certificate ${domain?.ssl ? 'removed from' : 'installed for'} ${domain?.name}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getTotalTraffic = () => {
    return domains.reduce((total, domain) => ({
      visitors: total.visitors + domain.traffic.visitors,
      pageviews: total.pageviews + domain.traffic.pageviews
    }), { visitors: 0, pageviews: 0 });
  };

  const totalTraffic = getTotalTraffic();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Domain Management</h2>
          <p className="text-gray-600">Manage your domains and subdomains</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Domain</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newDomain.name}
                  onChange={(e) => setNewDomain({...newDomain, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="docroot">Document Root</Label>
                <Input
                  id="docroot"
                  value={newDomain.documentRoot}
                  onChange={(e) => setNewDomain({...newDomain, documentRoot: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="php">PHP Version</Label>
                <Select value={newDomain.phpVersion} onValueChange={(value) => setNewDomain({...newDomain, phpVersion: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="7.4">PHP 7.4</SelectItem>
                    <SelectItem value="8.0">PHP 8.0</SelectItem>
                    <SelectItem value="8.1">PHP 8.1</SelectItem>
                    <SelectItem value="8.2">PHP 8.2</SelectItem>
                    <SelectItem value="8.3">PHP 8.3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ssl"
                  checked={newDomain.enableSSL}
                  onChange={(e) => setNewDomain({...newDomain, enableSSL: e.target.checked})}
                />
                <Label htmlFor="ssl">Enable SSL Certificate</Label>
              </div>
              <Button onClick={handleAddDomain} className="w-full">
                Add Domain
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Domains</p>
                <p className="text-2xl font-bold">{domains.length}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Domains</p>
                <p className="text-2xl font-bold text-green-600">
                  {domains.filter(d => d.status === 'active').length}
                </p>
              </div>
              <Server className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">SSL Enabled</p>
                <p className="text-2xl font-bold text-green-600">
                  {domains.filter(d => d.ssl).length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold">{totalTraffic.visitors.toLocaleString()}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain List */}
      <div className="grid gap-4">
        {domains.map((domain) => (
          <Card key={domain.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Server className="mr-2 h-5 w-5" />
                  {domain.name}
                  <ExternalLink className="ml-2 h-4 w-4 text-gray-400" />
                </CardTitle>
                <div className="flex space-x-2">
                  <Badge variant={getStatusColor(domain.status)}>
                    {domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
                  </Badge>
                  <Badge variant={domain.ssl ? 'default' : 'secondary'}>
                    {domain.ssl ? 'SSL Active' : 'No SSL'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="dns">DNS</TabsTrigger>
                  <TabsTrigger value="traffic">Traffic</TabsTrigger>
                  <TabsTrigger value="subdomains">Subdomains</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Expires</p>
                      <p className="font-medium">{domain.expires}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Registrar</p>
                      <p className="font-medium">{domain.registrar}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">IP Address</p>
                      <p className="font-medium">{domain.dns.a}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="dns" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">A Record</p>
                      <p className="text-sm bg-gray-50 p-2 rounded">{domain.dns.a}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">CNAME Records</p>
                      <div className="text-sm bg-gray-50 p-2 rounded">
                        {domain.dns.cname.map((record, i) => (
                          <div key={i}>{record}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">MX Records</p>
                      <div className="text-sm bg-gray-50 p-2 rounded">
                        {domain.dns.mx.map((record, i) => (
                          <div key={i}>{record}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="traffic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{domain.traffic.visitors.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Unique Visitors</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{domain.traffic.pageviews.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Page Views</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="subdomains" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {domain.subdomains.map((subdomain, i) => (
                      <Badge key={i} variant="outline" className="justify-center">
                        {subdomain}.{domain.name}
                      </Badge>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSSLToggle(domain.id)}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {domain.ssl ? 'Disable SSL' : 'Enable SSL'}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteDomain(domain.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
