
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Settings, Trash2, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DomainManagement = () => {
  const [domains, setDomains] = useState([
    { 
      id: 1, 
      name: 'example.com', 
      status: 'active', 
      ssl: true, 
      expires: '2024-12-15',
      subdomains: ['www', 'mail', 'ftp']
    },
    { 
      id: 2, 
      name: 'testsite.org', 
      status: 'active', 
      ssl: false, 
      expires: '2025-03-20',
      subdomains: ['www']
    },
  ]);

  const [newDomain, setNewDomain] = useState({
    name: '',
    documentRoot: '/var/www/html',
    phpVersion: '8.1'
  });

  const { toast } = useToast();

  const handleAddDomain = () => {
    if (!newDomain.name) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive"
      });
      return;
    }

    const domain = {
      id: domains.length + 1,
      name: newDomain.name,
      status: 'active',
      ssl: false,
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subdomains: ['www']
    };

    setDomains([...domains, domain]);
    setNewDomain({ name: '', documentRoot: '/var/www/html', phpVersion: '8.1' });
    toast({
      title: "Success",
      description: `Domain ${newDomain.name} has been added successfully`
    });
  };

  const handleDeleteDomain = (id: number) => {
    setDomains(domains.filter(domain => domain.id !== id));
    toast({
      title: "Domain Deleted",
      description: "Domain has been removed from the server"
    });
  };

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
          <DialogContent className="bg-white">
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
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddDomain} className="w-full">
                Add Domain
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {domains.map((domain) => (
          <Card key={domain.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Server className="mr-2 h-5 w-5" />
                  {domain.name}
                </CardTitle>
                <div className="flex space-x-2">
                  <Badge variant={domain.status === 'active' ? 'default' : 'destructive'}>
                    {domain.status}
                  </Badge>
                  <Badge variant={domain.ssl ? 'default' : 'secondary'}>
                    {domain.ssl ? 'SSL Active' : 'No SSL'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Expires</p>
                  <p className="font-medium">{domain.expires}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subdomains</p>
                  <p className="font-medium">{domain.subdomains.length} configured</p>
                </div>
                <div className="flex justify-end space-x-2">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
