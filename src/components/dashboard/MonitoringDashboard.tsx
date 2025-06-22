
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Cpu, Hard Drive, Monitor, Network, Server } from 'lucide-react';

export const MonitoringDashboard = () => {
  const [cpuData, setCpuData] = useState([
    { time: '00:00', cpu: 45, memory: 62, disk: 34 },
    { time: '04:00', cpu: 52, memory: 58, disk: 34 },
    { time: '08:00', cpu: 67, memory: 71, disk: 35 },
    { time: '12:00', cpu: 78, memory: 69, disk: 35 },
    { time: '16:00', cpu: 65, memory: 73, disk: 36 },
    { time: '20:00', cpu: 55, memory: 65, disk: 36 },
  ]);

  const [networkData, setNetworkData] = useState([
    { time: '00:00', inbound: 120, outbound: 80 },
    { time: '04:00', inbound: 100, outbound: 65 },
    { time: '08:00', inbound: 180, outbound: 120 },
    { time: '12:00', inbound: 220, outbound: 150 },
    { time: '16:00', inbound: 190, outbound: 130 },
    { time: '20:00', inbound: 160, outbound: 110 },
  ]);

  const [currentStats, setCurrentStats] = useState({
    cpu: 45,
    memory: 62,
    disk: 34,
    network: 1.2,
    uptime: '15 days, 8 hours',
    processes: 142,
    users: 3
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStats(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(95, prev.memory + (Math.random() - 0.5) * 5)),
        network: Math.max(0.1, Math.min(5, prev.network + (Math.random() - 0.5) * 0.5))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">System Monitoring</h2>
        <p className="text-gray-600">Real-time server performance and resource monitoring</p>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(currentStats.cpu)}%</div>
            <Progress value={currentStats.cpu} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Load average: 1.23
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(currentStats.memory)}%</div>
            <Progress value={currentStats.memory} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              5.2 GB / 8 GB used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <Hard Drive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.disk}%</div>
            <Progress value={currentStats.disk} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              34 GB / 100 GB used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.network.toFixed(1)} MB/s</div>
            <p className="text-xs text-muted-foreground mt-1">
              ↑ 0.8 MB/s ↓ 1.4 MB/s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              System Resources (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cpuData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="#8884d8" strokeWidth={2} name="CPU %" />
                <Line type="monotone" dataKey="memory" stroke="#82ca9d" strokeWidth={2} name="Memory %" />
                <Line type="monotone" dataKey="disk" stroke="#ffc658" strokeWidth={2} name="Disk %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Network className="mr-2 h-5 w-5" />
              Network Traffic (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={networkData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="inbound" stackId="1" stroke="#8884d8" fill="#8884d8" name="Inbound (MB/s)" />
                <Area type="monotone" dataKey="outbound" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Outbound (MB/s)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Process Monitor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="mr-2 h-5 w-5" />
            Top Processes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border rounded">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm">1234</span>
                <span className="font-medium">apache2</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm">15.2% CPU</span>
                <span className="text-sm">512 MB RAM</span>
                <Badge variant="default">Running</Badge>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 border rounded">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm">5678</span>
                <span className="font-medium">mysql</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm">8.7% CPU</span>
                <span className="text-sm">1.2 GB RAM</span>
                <Badge variant="default">Running</Badge>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 border rounded">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm">9012</span>
                <span className="font-medium">php-fpm</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm">5.3% CPU</span>
                <span className="text-sm">256 MB RAM</span>
                <Badge variant="default">Running</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hostname</span>
                <span className="text-sm font-medium">web-server-01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium">{currentStats.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kernel</span>
                <span className="text-sm font-medium">5.15.0-78-generic</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Architecture</span>
                <span className="text-sm font-medium">x86_64</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
                <p className="font-medium text-sm">High Memory Usage</p>
                <p className="text-xs text-gray-600">Memory usage above 60% for 10 minutes</p>
              </div>
              <div className="p-3 border-l-4 border-green-500 bg-green-50">
                <p className="font-medium text-sm">System Healthy</p>
                <p className="text-xs text-gray-600">All services running normally</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
