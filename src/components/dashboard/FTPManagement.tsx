
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, User, Settings, Trash2, Key, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FTPManagement = () => {
  const [ftpAccounts, setFtpAccounts] = useState([
    { 
      id: 1, 
      username: 'webmaster', 
      directory: '/public_html', 
      quota: '5GB',
      used: '2.3GB',
      status: 'active',
      lastLogin: '2024-01-15 14:30'
    },
    { 
      id: 2, 
      username: 'uploads', 
      directory: '/public_html/uploads', 
      quota: '1GB',
      used: '450MB',
      status: 'active',
      lastLogin: '2024-01-14 09:15'
    },
  ]);

  const [ftpConnections, setFtpConnections] = useState([
    { id: 1, ip: '192.168.1.100', user: 'webmaster', connected: '14:30:22', status: 'active' },
    { id: 2, ip: '10.0.0.50', user: 'uploads', connected: '13:45:10', status: 'idle' },
  ]);

  const { toast } = useToast();

  const handleCreateFTPAccount = () => {
    toast({
      title: "FTP Account Created",
      description: "New FTP account has been created successfully"
    });
  };

  const handleDeleteAccount = (id: number) => {
    setFtpAccounts(ftpAccounts.filter(acc => acc.id !== id));
    toast({
      title: "FTP Account Deleted",
      description: "FTP account has been removed"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">FTP Management</h2>
          <p className="text-gray-600">Manage FTP accounts and monitor connections</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create FTP Account
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Create New FTP Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ftpuser">Username</Label>
                <Input id="ftpuser" placeholder="ftpuser" />
              </div>
              <div>
                <Label htmlFor="ftppass">Password</Label>
                <Input id="ftppass" type="password" placeholder="Enter secure password" />
              </div>
              <div>
                <Label htmlFor="ftpdir">Directory</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select directory" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="/public_html">/public_html</SelectItem>
                    <SelectItem value="/public_html/subdomain">/public_html/subdomain</SelectItem>
                    <SelectItem value="/private">/private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quota">Quota (GB)</Label>
                <Input id="quota" type="number" placeholder="5" />
              </div>
              <Button onClick={handleCreateFTPAccount} className="w-full">
                Create FTP Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* FTP Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            FTP Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ftpAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center space-x-4">
                  <User className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{account.username}</p>
                    <p className="text-sm text-gray-600">{account.directory}</p>
                    <p className="text-xs text-gray-500">Last login: {account.lastLogin}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{account.used} / {account.quota}</p>
                    <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                      {account.status}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active FTP Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Active FTP Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ftpConnections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{conn.user}@{conn.ip}</p>
                    <p className="text-sm text-gray-600">Connected at {conn.connected}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={conn.status === 'active' ? 'default' : 'secondary'}>
                    {conn.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FTP Settings */}
      <Card>
        <CardHeader>
          <CardTitle>FTP Server Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Connection Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>FTP Server:</span>
                  <span className="font-mono">ftp.yourdomain.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Port:</span>
                  <span>21</span>
                </div>
                <div className="flex justify-between">
                  <span>SFTP Port:</span>
                  <span>22</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Connections:</span>
                  <span>50</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Security Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>SSL/TLS:</span>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Anonymous FTP:</span>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
                <div className="flex justify-between">
                  <span>IP Restrictions:</span>
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
