
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Terminal, Clock, Key, FileText, Settings, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AdvancedTools = () => {
  const [cronJobs, setCronJobs] = useState([
    { 
      id: 1, 
      name: 'Daily Backup', 
      command: '/usr/bin/backup.sh', 
      schedule: '0 2 * * *',
      status: 'active',
      lastRun: '2024-01-16 02:00:00'
    },
    { 
      id: 2, 
      name: 'Log Cleanup', 
      command: '/usr/bin/find /var/log -name "*.log" -mtime +30 -delete', 
      schedule: '0 3 * * 0',
      status: 'active',
      lastRun: '2024-01-14 03:00:00'
    },
  ]);

  const [apiTokens, setApiTokens] = useState([
    { 
      id: 1, 
      name: 'Backup Service', 
      token: 'cpanel_api_***************xyz',
      permissions: ['backup', 'files'],
      created: '2024-01-10',
      lastUsed: '2024-01-16'
    },
    { 
      id: 2, 
      name: 'Monitoring Tool', 
      token: 'cpanel_api_***************abc',
      permissions: ['stats', 'system'],
      created: '2024-01-08',
      lastUsed: '2024-01-15'
    },
  ]);

  const [errorPages] = useState([
    { code: '400', title: 'Bad Request', customized: false },
    { code: '401', title: 'Unauthorized', customized: false },
    { code: '403', title: 'Forbidden', customized: true },
    { code: '404', title: 'Not Found', customized: true },
    { code: '500', title: 'Internal Server Error', customized: false },
    { code: '503', title: 'Service Unavailable', customized: false },
  ]);

  const { toast } = useToast();

  const handleCreateCronJob = () => {
    toast({
      title: "Cron Job Created",
      description: "New cron job has been scheduled successfully"
    });
  };

  const handleDeleteCronJob = (id: number) => {
    setCronJobs(cronJobs.filter(job => job.id !== id));
    toast({
      title: "Cron Job Deleted",
      description: "Cron job has been removed"
    });
  };

  const handleCreateAPIToken = () => {
    toast({
      title: "API Token Created",
      description: "New API token has been generated"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Advanced Tools</h2>
          <p className="text-gray-600">Automation, APIs, and system configuration</p>
        </div>
      </div>

      {/* Cron Jobs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Cron Jobs
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Cron Job
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Create New Cron Job</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cronname">Job Name</Label>
                    <Input id="cronname" placeholder="Daily maintenance" />
                  </div>
                  <div>
                    <Label htmlFor="croncommand">Command</Label>
                    <Input id="croncommand" placeholder="/usr/bin/php /path/to/script.php" />
                  </div>
                  <div>
                    <Label htmlFor="cronschedule">Schedule (Cron Format)</Label>
                    <Input id="cronschedule" placeholder="0 2 * * *" />
                  </div>
                  <div className="text-xs text-gray-600">
                    <p>Examples:</p>
                    <p>• 0 2 * * * - Every day at 2:00 AM</p>
                    <p>• 0 */6 * * * - Every 6 hours</p>
                    <p>• 0 0 * * 0 - Every Sunday at midnight</p>
                  </div>
                  <Button onClick={handleCreateCronJob} className="w-full">
                    Create Cron Job
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cronJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center space-x-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{job.name}</p>
                    <p className="text-sm text-gray-600 font-mono">{job.command}</p>
                    <p className="text-xs text-gray-500">
                      Schedule: {job.schedule} | Last run: {job.lastRun}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                    {job.status}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteCronJob(job.id)}
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

      {/* API Tokens */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              API Tokens
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Token
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Generate API Token</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tokenname">Token Name</Label>
                    <Input id="tokenname" placeholder="My Application" />
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="perm-files" />
                        <label htmlFor="perm-files" className="text-sm">File Management</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="perm-email" />
                        <label htmlFor="perm-email" className="text-sm">Email Management</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="perm-domains" />
                        <label htmlFor="perm-domains" className="text-sm">Domain Management</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="perm-stats" />
                        <label htmlFor="perm-stats" className="text-sm">Statistics</label>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleCreateAPIToken} className="w-full">
                    Generate Token
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiTokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center space-x-4">
                  <Key className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">{token.name}</p>
                    <p className="text-sm text-gray-600 font-mono">{token.token}</p>
                    <p className="text-xs text-gray-500">
                      Created: {token.created} | Last used: {token.lastUsed}
                    </p>
                    <div className="flex space-x-1 mt-1">
                      {token.permissions.map((perm, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Regenerate
                  </Button>
                  <Button variant="destructive" size="sm">
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Custom Error Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {errorPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">HTTP {page.code}</p>
                  <p className="text-sm text-gray-600">{page.title}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={page.customized ? 'default' : 'secondary'}>
                    {page.customized ? 'Custom' : 'Default'}
                  </Badge>
                  <Button variant="outline" size="sm">
                    {page.customized ? 'Edit' : 'Customize'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Shell */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Terminal className="mr-2 h-5 w-5" />
            API Shell
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="apicommand">API Command</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select API function" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="listaccts">List Accounts</SelectItem>
                  <SelectItem value="diskusage">Disk Usage</SelectItem>
                  <SelectItem value="bandwidth">Bandwidth Usage</SelectItem>
                  <SelectItem value="domaininfo">Domain Information</SelectItem>
                  <SelectItem value="emailaccounts">Email Accounts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="apiparams">Parameters (JSON)</Label>
              <Textarea 
                id="apiparams" 
                placeholder='{"domain": "example.com"}'
                className="font-mono text-sm"
                rows={3}
              />
            </div>
            <Button className="w-full">
              <Terminal className="mr-2 h-4 w-4" />
              Execute API Call
            </Button>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Response:</p>
              <pre className="text-xs text-gray-800 font-mono">
                {`{
  "status": "success",
  "data": {
    "result": "API response will appear here"
  }
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
