
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
  TrendingDown, // Added
  Minus,        // Added
  Clock,
  Disc,         // Added for Disk Usage
  ArrowDownUp,  // Added for Network I/O
  BarChart,     // Added for Load Average
  Lock,         // Added for SSL Status
  TerminalSquare // Added for Active Processes
} from 'lucide-react';
import { systemMonitor, SystemMetrics } from '@/lib/systemMonitor';
import { Skeleton } from "@/components/ui/skeleton"; // Added

export const SystemOverview = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [stats, setStats] = useState([
    { name: 'Active Domains', value: '24', icon: Globe, change: '+2 this month', trend: 'up' },
    { name: 'Email Accounts', value: '156', icon: Mail, change: '+8 this week', trend: 'up' },
    { name: 'Databases', value: '12', icon: Database, change: '+1 this week', trend: 'up' },
    { name: 'FTP Users', value: '8', icon: Users, change: 'No change', trend: 'neutral' },
  ]);

  // Move formatUptime function declaration before it's used
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

      {/* Main Dashboard Grid for Summary Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Statistics Cards - already somewhat like summary boxes, adapted slightly */}
        {stats.map((stat) => {
          const Icon = stat.icon; // Icon component is uppercase
          const trendIcon =
            stat.trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-500" /> :
            stat.trend === 'down' ? <TrendingDown className="h-4 w-4 text-red-500" /> :
            stat.trend === 'neutral' ? <Minus className="h-4 w-4 text-gray-500" /> : null;

          return (
            <Card key={stat.name} className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                    {trendIcon}
                    <span>{stat.change}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Server Resources Boxes */}
        {metrics ? (
          <>
            {/* CPU Usage Box */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cpu.usage.toFixed(1)}%</div>
                <Progress value={metrics.cpu.usage} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1 truncate" title={`${metrics.cpu.cores} cores • ${metrics.cpu.model}`}>
                  {metrics.cpu.cores} cores • {metrics.cpu.model}
                </p>
              </CardContent>
            </Card>

            {/* Memory Usage Box */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <HardDrive className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.memory.usage.toFixed(1)}%</div>
                <Progress value={metrics.memory.usage} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {(metrics.memory.used / 1024).toFixed(1)}GB / {(metrics.memory.total / 1024).toFixed(1)}GB
                </p>
              </CardContent>
            </Card>

            {/* Disk Usage Box */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <Disc className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.disk.usage.toFixed(1)}%</div>
                <Progress value={metrics.disk.usage} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {(metrics.disk.used / 1024).toFixed(1)}GB / {(metrics.disk.total / 1024).toFixed(1)}GB Used
                </p>
              </CardContent>
            </Card>

            {/* Network Activity Box */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
                <ArrowDownUp className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  ↓ {(metrics.network.bytesIn / 1024 / 1024).toFixed(1)} MB
                </div>
                <div className="text-lg font-bold">
                  ↑ {(metrics.network.bytesOut / 1024 / 1024).toFixed(1)} MB
                </div>
                 <p className="text-xs text-muted-foreground mt-1">
                  Total: {((metrics.network.bytesIn + metrics.network.bytesOut) / 1024 / 1024).toFixed(1)} MB
                </p>
              </CardContent>
            </Card>

            {/* Server Uptime Box */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Server Uptime</CardTitle>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUptime(metrics.uptime)}</div>
                <p className="text-xs text-muted-foreground mt-1">Current system uptime</p>
              </CardContent>
            </Card>

            {/* Load Average Box */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Load Average</CardTitle>
                <BarChart className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.loadAverage.slice(0,3).map(l => l.toFixed(2)).join(' / ')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">1m / 5m / 15m averages</p>
              </CardContent>
            </Card>

            {/* Active Processes Box */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
                <TerminalSquare className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.processes}</div>
                 <p className="text-xs text-muted-foreground mt-1">Currently running processes</p>
              </CardContent>
            </Card>
          </>
        ) : (
          // Skeleton loaders for when metrics are null
          Array.from({ length: 7 }).map((_, index) => ( // Show skeletons for the typical number of metric cards
            <Card key={`skeleton-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-2 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))
        )}

        {/* Firewall Status Box (Static example) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Firewall Status</CardTitle>
            <Shield className="h-5 w-5 text-green-500" /> {/* Green icon for active */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground mt-1">UFW Enabled</p>
          </CardContent>
        </Card>

        {/* SSL Status Box (Static example) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SSL Certificates</CardTitle>
            <Lock className="h-5 w-5 text-green-500" /> {/* Green icon for secure */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Managed</div>
            <p className="text-xs text-muted-foreground mt-1">Via Let's Encrypt / Custom</p>
          </CardContent>
        </Card>

      </div>

      {/* The old combined "System Information" card, "Security Status" card, and "Quick Actions" card are removed. */}
      {/* Their content is now distributed into the summary boxes above or removed. */}
    </div>
  );
};
