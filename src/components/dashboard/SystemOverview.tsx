
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  HardDrive, 
  Server, 
  Users, 
  Globe, 
  Mail, 
  Shield 
} from 'lucide-react';

export const SystemOverview = () => {
  const stats = [
    { name: 'Active Domains', value: '24', icon: Globe, change: '+2 this month' },
    { name: 'Email Accounts', value: '156', icon: Mail, change: '+8 this week' },
    { name: 'Databases', value: '12', icon: Database, change: '+1 this week' },
    { name: 'FTP Users', value: '8', icon: Users, change: 'No change' },
  ];

  const systemInfo = [
    { label: 'Server Uptime', value: '15 days, 8 hours' },
    { label: 'Operating System', value: 'Ubuntu 22.04 LTS' },
    { label: 'Control Panel Version', value: 'HostPanel Pro v2.1.0' },
    { label: 'Last Backup', value: '2 hours ago' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome to your hosting control panel</p>
      </div>

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
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Server Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CPU Usage</span>
                <span>45%</span>
              </div>
              <Progress value={45} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>68%</span>
              </div>
              <Progress value={68} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Disk Usage</span>
                <span>82%</span>
              </div>
              <Progress value={82} />
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
              {systemInfo.map((info, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-sm text-gray-600">{info.label}:</span>
                  <span className="text-sm font-medium">{info.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
};
