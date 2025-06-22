
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Settings, Trash2, Globe, Database, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ApplicationsManagement = () => {
  const [installedApps, setInstalledApps] = useState([
    { 
      id: 1, 
      name: 'WordPress', 
      version: '6.4.2', 
      domain: 'example.com',
      path: '/blog',
      installed: '2024-01-10',
      status: 'active'
    },
    { 
      id: 2, 
      name: 'Joomla', 
      version: '5.0.1', 
      domain: 'shop.example.com',
      path: '/',
      installed: '2024-01-08',
      status: 'active'
    },
  ]);

  const [availableApps] = useState([
    { 
      name: 'WordPress', 
      version: '6.4.2', 
      description: 'Popular blogging platform and CMS',
      category: 'CMS',
      icon: '📝'
    },
    { 
      name: 'Joomla', 
      version: '5.0.1', 
      description: 'Flexible content management system',
      category: 'CMS',
      icon: '🏗️'
    },
    { 
      name: 'Drupal', 
      version: '10.2.0', 
      description: 'Enterprise-grade CMS platform',
      category: 'CMS',
      icon: '🔧'
    },
    { 
      name: 'PrestaShop', 
      version: '8.1.3', 
      description: 'E-commerce platform',
      category: 'E-Commerce',
      icon: '🛒'
    },
    { 
      name: 'Magento', 
      version: '2.4.6', 
      description: 'Professional e-commerce solution',
      category: 'E-Commerce',
      icon: '🛍️'
    },
    { 
      name: 'phpMyAdmin', 
      version: '5.2.1', 
      description: 'MySQL database administration',
      category: 'Database',
      icon: '🗄️'
    },
  ]);

  const { toast } = useToast();

  const handleInstallApp = (appName: string) => {
    toast({
      title: "Installation Started",
      description: `${appName} installation has been queued`
    });
  };

  const handleUninstallApp = (id: number) => {
    setInstalledApps(installedApps.filter(app => app.id !== id));
    toast({
      title: "Application Uninstalled",
      description: "Application has been removed successfully"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Applications Management</h2>
          <p className="text-gray-600">Install and manage web applications</p>
        </div>
      </div>

      {/* Installed Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Installed Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {installedApps.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{app.name} {app.version}</p>
                    <p className="text-sm text-gray-600">{app.domain}{app.path}</p>
                    <p className="text-xs text-gray-500">Installed: {app.installed}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={app.status === 'active' ? 'default' : 'secondary'}>
                    {app.status}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      Update
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleUninstallApp(app.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Uninstall
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Available Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableApps.map((app, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{app.icon}</span>
                    <div>
                      <h4 className="font-medium">{app.name}</h4>
                      <p className="text-sm text-gray-600">v{app.version}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{app.category}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">{app.description}</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Install
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Install {app.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="domain">Domain</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select domain" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="example.com">example.com</SelectItem>
                            <SelectItem value="blog.example.com">blog.example.com</SelectItem>
                            <SelectItem value="shop.example.com">shop.example.com</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="path">Installation Path</Label>
                        <Input id="path" placeholder="/" />
                      </div>
                      <div>
                        <Label htmlFor="adminuser">Admin Username</Label>
                        <Input id="adminuser" placeholder="admin" />
                      </div>
                      <div>
                        <Label htmlFor="adminpass">Admin Password</Label>
                        <Input id="adminpass" type="password" placeholder="Enter secure password" />
                      </div>
                      <Button onClick={() => handleInstallApp(app.name)} className="w-full">
                        Install {app.name}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Installation Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Download className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No installations in progress</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
