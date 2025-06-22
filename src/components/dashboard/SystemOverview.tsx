
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Database, 
  HardDrive, 
  Server, 
  Users, 
  Globe, 
  Mail, 
  Shield,
  TrendingUp,
  Clock
} from 'lucide-react';
import { systemMonitor, SystemMetrics } from '@/lib/systemMonitor';

export const SystemOverview = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [stats, setStats] = useState([
    { name: 'Active Domains', value: '24', icon: Globe, change: '+2 this month', trend: 'up' },
    { name: 'Email Accounts', value: '156', icon: Mail, change: '+8 this week', trend: 'up' },
    { name: 'Databases', value: '12', icon: Database, change: '+1 this week', trend: 'up' },
    { name: 'FTP Users', value: '8', icon: Users, change: 'No change', trend: 'neutral' },
  ]);

  useEffect(() => {
    const initializeMonitoring = async () => {
      await systemMonitor.startMonitoring(5000);
      
      const interval = setInterval(() => {
        const currentMetrics = systemMonitor.getMetrics();
        if (currentMetrics) {
          setMetrics(currentMetrics);
        }
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    };

    const cleanup = initializeMonitoring();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, []);

  const systemInfo = [
    { label: 'Server Uptime', value: metrics ? formatUptime(metrics.uptime) : 'Loading...' },
    { label: 'Operating System', value: 'Ubuntu 22.04 LTS' },
    { label: 'Control Panel Version', value: 'HostPanel Pro v2.1.0' },
    { label: 'Last Backup', value: '2 hours ago' },
    { label: 'Active Processes', value: metrics ? metrics.processes.toString() : 'Loading...' },
    { label: 'Load Average', value: metrics ? metrics.loadAverage.slice(0, 3).map(l => l.toFixed(2)).join(', ') : 'Loading...' },
  ];

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} days, ${hours} hours`;
    } else if (hours > 0) {
      return `${hours} hours, ${minutes} minutes`;
    } else {
      return `${minutes} minutes`;
    }
  };

  const getResourceColor = (usage: number) => {
    if (usage > 80) return 'text-red-600';
    if (usage > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome to your hosting control panel</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-1">
                  {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Resources - Real-time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Server className="mr-2 h-5 w-5" />
                Server Resources
              </div>
              <Badge variant="outline" className="animate-pulse">
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics ? (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span className={getResourceColor(metrics.cpu.usage)}>
                      {metrics.cpu.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.cpu.usage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics.cpu.cores} cores • {metrics.cpu.model}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span className={getResourceColor(metrics.memory.usage)}>
                      {metrics.memory.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.memory.usage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {(metrics.memory.used / 1024).toFixed(1)}GB / {(metrics.memory.total / 1024).toFixed(1)}GB
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disk Usage</span>
                    <span className={getResourceColor(metrics.disk.usage)}>
                      {metrics.disk.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.disk.usage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {(metrics.disk.used / 1024).toFixed(1)}GB / {(metrics.disk.total / 1024).toFixed(1)}GB free
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Network Activity</span>
                    <span className="text-blue-600">
                      {((metrics.network.bytesIn + metrics.network.bytesOut) / 1024 / 1024).toFixed(1)} MB/s
                    </span>
                  </div>
                  <div className="flex space-x-2 text-xs text-gray-500">
                    <span>↓ {(metrics.network.bytesIn / 1024 / 1024).toFixed(1)} MB</span>
                    <span>↑ {(metrics.network.bytesOut / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemInfo.map((info, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center">
                    {info.label === 'Server Uptime' && <Clock className="w-3 h-3 mr-1" />}
                    {info.label}:
                  </span>
                  <span className="text-sm font-medium">{info.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-green-800">Firewall Active</p>
              <p className="text-xs text-green-600">All ports secured</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-green-800">SSL Active</p>
              <p className="text-xs text-green-600">Certificates valid</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-sm font-medium text-yellow-800">Updates Available</p>
              <p className="text-xs text-yellow-600">3 security patches</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="text-center">
                  <Server className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <p className="text-xs font-medium">Restart Services</p>
                </div>
              </button>
              <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="text-center">
                  <Database className="h-6 w-6 mx-auto mb-1 text-green-600" />
                  <p className="text-xs font-medium">Backup Now</p>
                </div>
              </button>
              <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                  <p className="text-xs font-medium">Security Scan</p>
                </div>
              </button>
              <button className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                <div className="text-center">
                  <HardDrive className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                  <p className="text-xs font-medium">Disk Cleanup</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
