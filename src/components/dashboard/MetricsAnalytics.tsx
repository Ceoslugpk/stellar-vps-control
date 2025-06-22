
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BarChart as BarChartIcon, TrendingUp, Globe, HardDrive, Activity } from 'lucide-react';

export const MetricsAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const bandwidthData = [
    { date: '2024-01-10', inbound: 2.1, outbound: 1.8 },
    { date: '2024-01-11', inbound: 3.2, outbound: 2.1 },
    { date: '2024-01-12', inbound: 2.8, outbound: 1.9 },
    { date: '2024-01-13', inbound: 4.1, outbound: 2.7 },
    { date: '2024-01-14', inbound: 3.7, outbound: 2.3 },
    { date: '2024-01-15', inbound: 5.2, outbound: 3.1 },
    { date: '2024-01-16', inbound: 4.8, outbound: 2.9 },
  ];

  const diskUsageData = [
    { name: 'Web Files', value: 35, color: '#3b82f6' },
    { name: 'Databases', value: 20, color: '#10b981' },
    { name: 'Email', value: 15, color: '#f59e0b' },
    { name: 'Logs', value: 10, color: '#ef4444' },
    { name: 'Backups', value: 12, color: '#8b5cf6' },
    { name: 'Other', value: 8, color: '#6b7280' },
  ];

  const visitorStats = [
    { date: '2024-01-10', visitors: 1250, pageviews: 3200 },
    { date: '2024-01-11', visitors: 1430, pageviews: 3800 },
    { date: '2024-01-12', visitors: 1320, pageviews: 3500 },
    { date: '2024-01-13', visitors: 1680, pageviews: 4200 },
    { date: '2024-01-14', visitors: 1520, pageviews: 3900 },
    { date: '2024-01-15', visitors: 1850, pageviews: 4600 },
    { date: '2024-01-16', visitors: 1720, pageviews: 4300 },
  ];

  const topPages = [
    { page: '/', visits: 2340, bounce: '42%' },
    { page: '/blog', visits: 1890, bounce: '38%' },
    { page: '/products', visits: 1560, bounce: '45%' },
    { page: '/contact', visits: 980, bounce: '55%' },
    { page: '/about', visits: 720, bounce: '48%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Metrics & Analytics</h2>
          <p className="text-gray-600">Monitor website performance and resource usage</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bandwidth</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.8 GB</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1 GB</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">+5%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10,240</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">26,500</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+22%</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bandwidth Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChartIcon className="mr-2 h-5 w-5" />
              Bandwidth Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bandwidthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="inbound" fill="#3b82f6" name="Inbound (GB)" />
                <Bar dataKey="outbound" fill="#10b981" name="Outbound (GB)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Disk Usage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDrive className="mr-2 h-5 w-5" />
              Disk Usage Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={diskUsageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {diskUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {diskUsageData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" />
            Visitor Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={visitorStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="visitors" stroke="#3b82f6" name="Visitors" />
              <Line type="monotone" dataKey="pageviews" stroke="#10b981" name="Page Views" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="font-mono text-sm">{page.page}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span>{page.visits.toLocaleString()} visits</span>
                  <span className="text-gray-600">Bounce: {page.bounce}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
