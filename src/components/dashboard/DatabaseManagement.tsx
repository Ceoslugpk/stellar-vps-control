
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Database, User, Settings, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DatabaseManagement = () => {
  const [databases, setDatabases] = useState([
    { 
      id: 1, 
      name: 'website_db', 
      type: 'MySQL', 
      size: '45.2 MB', 
      tables: 12,
      users: ['admin', 'app_user']
    },
    { 
      id: 2, 
      name: 'analytics_db', 
      type: 'PostgreSQL', 
      size: '128.7 MB', 
      tables: 8,
      users: ['postgres', 'analyst']
    },
  ]);

  const [newDatabase, setNewDatabase] = useState({
    name: '',
    type: 'MySQL',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
  });

  const { toast } = useToast();

  const handleCreateDatabase = () => {
    if (!newDatabase.name) {
      toast({
        title: "Error",
        description: "Please enter a database name",
        variant: "destructive"
      });
      return;
    }

    const database = {
      id: databases.length + 1,
      name: newDatabase.name,
      type: newDatabase.type,
      size: '0 MB',
      tables: 0,
      users: []
    };

    setDatabases([...databases, database]);
    setNewDatabase({ name: '', type: 'MySQL', charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci' });
    toast({
      title: "Success",
      description: `Database ${newDatabase.name} created successfully`
    });
  };

  const handleDeleteDatabase = (id: number) => {
    setDatabases(databases.filter(db => db.id !== id));
    toast({
      title: "Database Deleted",
      description: "Database has been permanently removed"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Database Management</h2>
          <p className="text-gray-600">Manage MySQL, PostgreSQL, and other databases</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Database
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Create New Database</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dbname">Database Name</Label>
                <Input
                  id="dbname"
                  placeholder="my_database"
                  value={newDatabase.name}
                  onChange={(e) => setNewDatabase({...newDatabase, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="dbtype">Database Type</Label>
                <Select value={newDatabase.type} onValueChange={(value) => setNewDatabase({...newDatabase, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="MySQL">MySQL</SelectItem>
                    <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                    <SelectItem value="MariaDB">MariaDB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="charset">Character Set</Label>
                <Select value={newDatabase.charset} onValueChange={(value) => setNewDatabase({...newDatabase, charset: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="utf8mb4">utf8mb4</SelectItem>
                    <SelectItem value="utf8">utf8</SelectItem>
                    <SelectItem value="latin1">latin1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateDatabase} className="w-full">
                Create Database
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {databases.map((db) => (
          <Card key={db.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  {db.name}
                </CardTitle>
                <Badge variant="outline">
                  {db.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-medium">{db.size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tables</p>
                  <p className="font-medium">{db.tables}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Users</p>
                  <p className="font-medium">{db.users.length} authorized</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <User className="mr-2 h-4 w-4" />
                    Users
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteDatabase(db.id)}
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

      {/* Database Users Section */}
      <Card>
        <CardHeader>
          <CardTitle>Database Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded">
              <div>
                <p className="font-medium">root</p>
                <p className="text-sm text-gray-600">All privileges</p>
              </div>
              <Badge>Admin</Badge>
            </div>
            <div className="flex justify-between items-center p-4 border rounded">
              <div>
                <p className="font-medium">app_user</p>
                <p className="text-sm text-gray-600">website_db access</p>
              </div>
              <Badge variant="secondary">Limited</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
