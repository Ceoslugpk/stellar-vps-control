
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Network, 
  Server, 
  Zap,
  RefreshCw,
  Terminal,
  Play,
  Square,
  AlertTriangle
} from 'lucide-react';
import { systemMonitor, SystemMetrics, ServiceStatus } from '@/lib/systemMonitor';

export const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const startMonitoring = async () => {
      setIsMonitoring(true);
      await systemMonitor.startMonitoring(3000); // Update every 3 seconds
      
      const interval = setInterval(() => {
        const currentMetrics = systemMonitor.getMetrics();
        const currentServices = systemMonitor.getServices();
        
        if (currentMetrics) {
          setMetrics(currentMetrics);
          setServices(currentServices);
          setLastUpdate(new Date());
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        systemMonitor.stopMonitoring();
        setIsMonitoring(false);
      };
    };

    const cleanup = startMonitoring();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, []);

  const systemMetricsCards = metrics ? [
    { 
      name: 'CPU Usage', 
      value: metrics.cpu.usage, 
      icon: Cpu, 
      color: metrics.cpu.usage > 80 ? 'text-red-600' : metrics.cpu.usage > 60 ? 'text-yellow-600' : 'text-blue-600',
      info: `${metrics.cpu.cores} cores`
    },
    { 
      name: 'Memory Usage', 
      value: metrics.memory.usage, 
      icon: MemoryStick, 
      color: metrics.memory.usage > 80 ? 'text-red-600' : metrics.memory.usage > 60 ? 'text-yellow-600' : 'text-green-600',
      info: `${(metrics.memory.used / 1024).toFixed(1)}GB / ${(metrics.memory.total / 1024).toFixed(1)}GB`
    },
    { 
      name: 'Disk Usage', 
      value: metrics.disk.usage, 
      icon: HardDrive, 
      color: metrics.disk.usage > 80 ? 'text-red-600' : metrics.disk.usage > 60 ? 'text-yellow-600' : 'text-yellow-600',
      info: `${(metrics.disk.used / 1024).toFixed(1)}GB / ${(metrics.disk.total / 1024).toFixed(1)}GB`
    },
    { 
      name: 'Load Average', 
      value: (metrics.loadAverage[0] / metrics.cpu.cores) * 100, 
      icon: Network, 
      color: metrics.loadAverage[0] > metrics.cpu.cores ? 'text-red-600' : 'text-purple-600',
      info: `${metrics.loadAverage.join(', ')}`
    },
  ] : [];

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'error': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const generateAlerts = () => {
    const alerts = [];
    
    if (metrics?.disk.usage && metrics.disk.usage > 80) {
      alerts.push({
        type: 'warning',
        title: 'High Disk Usage',
        message: `Disk usage is at ${metrics.disk.usage}%. Consider cleaning up or expanding storage.`,
        icon: HardDrive
      });
    }
    
    if (metrics?.memory.usage && metrics.memory.usage > 85) {
      alerts.push({
        type: 'error',
        title: 'High Memory Usage',
        message: `Memory usage is at ${metrics.memory.usage}%. System may become unstable.`,
        icon: MemoryStick
      });
    }
    
    if (metrics?.cpu.usage && metrics.cpu.usage > 90) {
      alerts.push({
        type: 'error',
        title: 'High CPU Usage',
        message: `CPU usage is at ${metrics.cpu.usage}%. Performance may be degraded.`,
        icon: Cpu
      });
    }

    const stoppedServices = services.filter(service => service.status === 'stopped');
    if (stoppedServices.length > 0) {
      alerts.push({
        type: 'error',
        title: 'Services Down',
        message: `${stoppedServices.length} service(s) are not running: ${stoppedServices.map(s => s.name).join(', ')}`,
        icon: Server
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: 'info',
        title: 'System Running Smoothly',
        message: 'All systems are operating within normal parameters.',
        icon: Activity
      });
    }
    
    return alerts;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">System Monitoring</h2>
          <p className="text-gray-600">
            Real-time server performance and status
            {lastUpdate && (
              <span className="ml-2 text-sm">
                (Last updated: {lastUpdate.toLocaleTimeString()})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Live" : "Offline"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetricsCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value.toFixed(1)}%</div>
                <Progress value={metric.value} className="mt-2" />
                <p className="text-xs text-gray-500 mt-1">{metric.info}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="mr-2 h-5 w-5" />
            Service Status
            <Badge className="ml-2" variant="outline">
              {services.filter(s => s.status === 'running').length}/{services.length} Running
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${getServiceStatusColor(service.status)} rounded-full`}></div>
                  <span className="font-medium">{service.name}</span>
                  {service.pid && (
                    <Badge variant="outline" className="text-xs">
                      PID: {service.pid}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className={`font-medium ${
                    service.status === 'running' ? 'text-green-600' : 
                    service.status === 'stopped' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </span>
                  <span>Uptime: {service.uptime}</span>
                  <span>CPU: {service.cpu.toFixed(1)}%</span>
                  <span>RAM: {service.memory.toFixed(1)}MB</span>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                      {service.status === 'running' ? (
                        <Square className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {generateAlerts().map((alert, index) => {
              const Icon = alert.icon;
              const bgColor = alert.type === 'error' ? 'bg-red-50 border-red-400' : 
                             alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' : 
                             'bg-blue-50 border-blue-400';
              const textColor = alert.type === 'error' ? 'text-red-800' : 
                               alert.type === 'warning' ? 'text-yellow-800' : 
                               'text-blue-800';
              const iconColor = alert.type === 'error' ? 'text-red-600' : 
                               alert.type === 'warning' ? 'text-yellow-600' : 
                               'text-blue-600';
              
              return (
                <div key={index} className={`flex items-center p-3 ${bgColor} border-l-4 rounded`}>
                  <Icon className={`h-5 w-5 ${iconColor} mr-3`} />
                  <div>
                    <p className={`font-medium ${textColor}`}>{alert.title}</p>
                    <p className={`text-sm ${textColor.replace('800', '700')}`}>{alert.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Terminal className="mr-2 h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-600">Server Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="font-medium">{formatUptime(metrics.uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processes:</span>
                    <span className="font-medium">{metrics.processes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPU Model:</span>
                    <span className="font-medium">{metrics.cpu.model}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-600">Network Stats</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Bytes In:</span>
                    <span className="font-medium">{(metrics.network.bytesIn / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bytes Out:</span>
                    <span className="font-medium">{(metrics.network.bytesOut / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packets In:</span>
                    <span className="font-medium">{metrics.network.packetsIn.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-600">Load Average</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>1 min:</span>
                    <span className="font-medium">{metrics.loadAverage[0].toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>5 min:</span>
                    <span className="font-medium">{metrics.loadAverage[1].toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>15 min:</span>
                    <span className="font-medium">{metrics.loadAverage[2].toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
