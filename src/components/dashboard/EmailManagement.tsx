
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Mail, Settings, Trash2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const EmailManagement = () => {
  const [emailAccounts, setEmailAccounts] = useState([
    { 
      id: 1, 
      email: 'admin@example.com', 
      quota: '1GB', 
      used: '340MB',
      status: 'active',
      forwarding: false
    },
    { 
      id: 2, 
      email: 'support@example.com', 
      quota: '500MB', 
      used: '45MB',
      status: 'active',
      forwarding: true
    },
  ]);

  const [newAccount, setNewAccount] = useState({
    username: '',
    domain: 'example.com',
    password: '',
    quota: '500'
  });

  const { toast } = useToast();

  const handleCreateAccount = () => {
    if (!newAccount.username || !newAccount.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const account = {
      id: emailAccounts.length + 1,
      email: `${newAccount.username}@${newAccount.domain}`,
      quota: `${newAccount.quota}MB`,
      used: '0MB',
      status: 'active',
      forwarding: false
    };

    setEmailAccounts([...emailAccounts, account]);
    setNewAccount({ username: '', domain: 'example.com', password: '', quota: '500' });
    toast({
      title: "Success",
      description: `Email account ${account.email} created successfully`
    });
  };

  const handleDeleteAccount = (id: number) => {
    setEmailAccounts(emailAccounts.filter(account => account.id !== id));
    toast({
      title: "Account Deleted",
      description: "Email account has been removed"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Email Management</h2>
          <p className="text-gray-600">Manage email accounts, forwarding, and mail server settings</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Email Account
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Create Email Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({...newAccount, username: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={newAccount.domain}
                  onChange={(e) => setNewAccount({...newAccount, domain: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAccount.password}
                  onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="quota">Quota (MB)</Label>
                <Input
                  id="quota"
                  type="number"
                  value={newAccount.quota}
                  onChange={(e) => setNewAccount({...newAccount, quota: e.target.value})}
                />
              </div>
              <Button onClick={handleCreateAccount} className="w-full">
                Create Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Email Accounts</TabsTrigger>
          <TabsTrigger value="forwarding">Forwarding</TabsTrigger>
          <TabsTrigger value="settings">Mail Server</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid gap-4">
            {emailAccounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <Mail className="mr-2 h-5 w-5" />
                      {account.email}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                        {account.status}
                      </Badge>
                      {account.forwarding && (
                        <Badge variant="secondary">Forwarding</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Quota</p>
                      <p className="font-medium">{account.quota}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Used</p>
                      <p className="font-medium">{account.used}</p>
                    </div>
                    <div className="flex justify-end space-x-2">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="forwarding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Forwarding Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">info@example.com</p>
                    <p className="text-sm text-gray-600">→ admin@example.com</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">contact@example.com</p>
                    <p className="text-sm text-gray-600">→ support@example.com</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  SMTP Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">SMTP Server</span>
                    <span className="text-sm font-medium">mail.example.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Port</span>
                    <span className="text-sm font-medium">587 (TLS)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Authentication</span>
                    <Badge variant="default">Required</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>IMAP/POP3 Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IMAP Server</span>
                    <span className="text-sm font-medium">mail.example.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IMAP Port</span>
                    <span className="text-sm font-medium">993 (SSL)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">POP3 Port</span>
                    <span className="text-sm font-medium">995 (SSL)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
