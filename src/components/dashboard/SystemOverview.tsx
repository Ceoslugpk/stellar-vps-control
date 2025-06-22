
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Hard Drive, 
  Monitor, 
  Cpu, 
  Activity,
  Users,
  Database,
  Mail,
  Shield
} from 'lucide-react';

export const SystemOverview = () => {
  const [systemStats, setSystemStats] = useState({
    cpu: 45,
    memory: 62,
    disk: 34,
    uptime: '15 days, 8 hours',
    load: '0.85',
    processes: 142
  });

  const [services, setServices] = useState([
    { name: 'Apache Web Server', status: 'running' },
    { name: 'MySQL Database', status: 'running' },
    { name: 'Postfix Mail', status: 'running' },
    { name: 'SSH Daemon', status: 'running' },
    { name: 'FTP Server', status: 'stopped' },
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(95, prev.memory + (Math.random() - 0.5) * 5)),
        load: (parseFloat(prev.load) + (Math.random() - 0.5) * 0.2).toFixed(2)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">System Overview</h2>
        <p className="text-gray-600">Real-time server monitoring and management dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.cpu}%</div>
            <Progress value={systemStats.cpu} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.memory}%</div>
            <Progress value={systemStats.memory} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <Hard Drive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.disk}%</div>
            <Progress value={systemStats.disk} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.load}</div>
            <p className="text-xs text-muted-foreground">Average load</p>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              System Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{service.name}</span>
                  <Badge 
                    variant={service.status === 'running' ? 'default' : 'destructive'}
                  >
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium">{systemStats.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Processes</span>
                <span className="text-sm font-medium">{systemStats.processes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">OS</span>
                <span className="text-sm font-medium">Ubuntu 22.04 LTS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kernel</span>
                <span className="text-sm font-medium">5.15.0-78-generic</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">Manage Users</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Database className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium">Databases</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Mail className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">Email Setup</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Shield className="h-8 w-8 text-red-600 mb-2" />
              <span className="text-sm font-medium">Security</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
