
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Network, 
  Server, 
  Zap 
} from 'lucide-react';

export const MonitoringDashboard = () => {
  const systemMetrics = [
    { name: 'CPU Usage', value: 45, icon: Cpu, color: 'text-blue-600' },
    { name: 'Memory Usage', value: 68, icon: MemoryStick, color: 'text-green-600' },
    { name: 'Disk Usage', value: 82, icon: HardDrive, color: 'text-yellow-600' },
    { name: 'Network I/O', value: 35, icon: Network, color: 'text-purple-600' },
  ];

  const serverStatus = [
    { service: 'Apache Web Server', status: 'Running', uptime: '15d 8h 42m' },
    { service: 'MySQL Database', status: 'Running', uptime: '15d 8h 41m' },
    { service: 'SSH Daemon', status: 'Running', uptime: '15d 8h 42m' },
    { service: 'Email Server', status: 'Running', uptime: '15d 8h 40m' },
    { service: 'FTP Server', status: 'Running', uptime: '15d 8h 39m' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">System Monitoring</h2>
        <p className="text-gray-600">Real-time server performance and status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}%</div>
                <Progress value={metric.value} className="mt-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="mr-2 h-5 w-5" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serverStatus.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{service.service}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="text-green-600 font-medium">{service.status}</span>
                  <span>Uptime: {service.uptime}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Performance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <Zap className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-yellow-800">High Disk Usage</p>
                <p className="text-sm text-yellow-700">Disk usage is above 80%. Consider cleaning up or expanding storage.</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <Activity className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-800">System Update Available</p>
                <p className="text-sm text-blue-700">Security updates are available for installation.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
