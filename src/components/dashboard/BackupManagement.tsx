
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Archive, Download, Settings, Trash2, Plus, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Backup {
  id: number;
  name: string;
  date: string;
  size: string;
  type: string;
  status: string;
}

export const BackupManagement = () => {
  const [backups, setBackups] = useState<Backup[]>([
    {
      id: 1,
      name: 'Full System Backup',
      date: '2024-01-15 02:00',
      size: '2.4 GB',
      type: 'full',
      status: 'completed'
    },
    {
      id: 2,
      name: 'Database Backup',
      date: '2024-01-14 02:00',
      size: '245 MB',
      type: 'database',
      status: 'completed'
    },
    {
      id: 3,
      name: 'Files Backup',
      date: '2024-01-13 02:00',
      size: '1.8 GB',
      type: 'files',
      status: 'completed'
    }
  ]);

  const [backupInProgress, setBackupInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const { toast } = useToast();

  const handleCreateBackup = (type: string) => {
    setBackupInProgress(true);
    setBackupProgress(0);

    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setBackupInProgress(false);
          
          const newBackup = {
            id: backups.length + 1,
            name: `${type === 'full' ? 'Full System' : type === 'database' ? 'Database' : 'Files'} Backup`,
            date: new Date().toLocaleString(),
            size: type === 'full' ? '2.6 GB' : type === 'database' ? '267 MB' : '1.9 GB',
            type,
            status: 'completed'
          };
          
          setBackups(prev => [newBackup, ...prev]);
          toast({
            title: "Backup Completed",
            description: `${newBackup.name} has been created successfully`
          });
          
          return 0;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleDeleteBackup = (id: number) => {
    setBackups(backups.filter(backup => backup.id !== id));
    toast({
      title: "Backup Deleted",
      description: "Backup file has been removed"
    });
  };

  const handleDownloadBackup = (backup: Backup) => {
    toast({
      title: "Download Started",
      description: `Downloading ${backup.name}...`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Backup Management</h2>
          <p className="text-gray-600">Create and manage system backups</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button disabled={backupInProgress}>
              <Plus className="mr-2 h-4 w-4" />
              Create Backup
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Create New Backup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="backup-type">Backup Type</Label>
                <Select onValueChange={(value) => handleCreateBackup(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select backup type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="full">Full System Backup</SelectItem>
                    <SelectItem value="database">Database Only</SelectItem>
                    <SelectItem value="files">Files Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Backup Progress */}
      {backupInProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Archive className="mr-2 h-5 w-5 animate-pulse" />
              Backup in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Creating backup...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup List */}
      <div className="grid gap-4">
        {backups.map((backup) => (
          <Card key={backup.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Archive className="mr-2 h-5 w-5" />
                  {backup.name}
                </CardTitle>
                <Badge variant={backup.status === 'completed' ? 'default' : 'secondary'}>
                  {backup.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">{backup.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-medium">{backup.size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium capitalize">{backup.type}</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadBackup(backup)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteBackup(backup.id)}
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

      {/* Backup Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Backup Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-medium">Daily Database Backup</p>
                <p className="text-sm text-gray-600">Every day at 2:00 AM</p>
              </div>
              <Badge>Active</Badge>
            </div>
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-medium">Weekly Full System Backup</p>
                <p className="text-sm text-gray-600">Every Sunday at 1:00 AM</p>
              </div>
              <Badge>Active</Badge>
            </div>
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-medium">Monthly Archive Backup</p>
                <p className="text-sm text-gray-600">First day of each month at 12:00 AM</p>
              </div>
              <Badge variant="secondary">Inactive</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Storage Used</span>
                <span>4.7 GB / 50 GB</span>
              </div>
              <Progress value={9.4} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">3</p>
                <p className="text-sm text-gray-600">Full Backups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">12</p>
                <p className="text-sm text-gray-600">Database Backups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">8</p>
                <p className="text-sm text-gray-600">File Backups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">45.3</p>
                <p className="text-sm text-gray-600">GB Available</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
