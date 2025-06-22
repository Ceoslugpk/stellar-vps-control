
export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    used: number;
    total: number;
    free: number;
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    free: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  uptime: number;
  loadAverage: number[];
  processes: number;
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  pid?: number;
  uptime: string;
  memory: number;
  cpu: number;
}

export class SystemMonitor {
  private static instance: SystemMonitor;
  private metrics: SystemMetrics | null = null;
  private services: ServiceStatus[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  public async startMonitoring(intervalMs: number = 5000): Promise<void> {
    await this.updateMetrics();
    await this.updateServiceStatus();
    
    this.updateInterval = setInterval(async () => {
      await this.updateMetrics();
      await this.updateServiceStatus();
    }, intervalMs);
  }

  public stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private async updateMetrics(): Promise<void> {
    try {
      // In a real implementation, these would call actual system APIs
      // For demo purposes, we'll simulate realistic data
      const cpuUsage = this.simulateRealisticValue(45, 15, 0, 100);
      const memoryUsage = this.simulateRealisticValue(68, 10, 0, 100);
      const diskUsage = this.simulateRealisticValue(82, 3, 0, 100);
      
      this.metrics = {
        cpu: {
          usage: cpuUsage,
          cores: navigator.hardwareConcurrency || 4,
          model: 'Intel Xeon E5-2686 v4'
        },
        memory: {
          used: (memoryUsage / 100) * 8192, // 8GB total
          total: 8192,
          free: 8192 - (memoryUsage / 100) * 8192,
          usage: memoryUsage
        },
        disk: {
          used: (diskUsage / 100) * 51200, // 50GB total
          total: 51200,
          free: 51200 - (diskUsage / 100) * 51200,
          usage: diskUsage
        },
        network: {
          bytesIn: Math.floor(Math.random() * 1000000),
          bytesOut: Math.floor(Math.random() * 500000),
          packetsIn: Math.floor(Math.random() * 10000),
          packetsOut: Math.floor(Math.random() * 8000)
        },
        uptime: Math.floor(Date.now() / 1000 - Math.random() * 1000000),
        loadAverage: [
          this.simulateRealisticValue(1.2, 0.3, 0, 4),
          this.simulateRealisticValue(1.1, 0.2, 0, 4),
          this.simulateRealisticValue(1.0, 0.1, 0, 4)
        ],
        processes: Math.floor(Math.random() * 50) + 120
      };
    } catch (error) {
      console.error('Failed to update system metrics:', error);
    }
  }

  private async updateServiceStatus(): Promise<void> {
    try {
      const services = [
        'Apache Web Server',
        'MySQL Database',
        'SSH Daemon',
        'Email Server',
        'FTP Server',
        'Redis Cache',
        'Nginx Proxy'
      ];

      this.services = services.map(serviceName => ({
        name: serviceName,
        status: Math.random() > 0.05 ? 'running' : 'stopped' as const,
        pid: Math.floor(Math.random() * 32000) + 1000,
        uptime: this.formatUptime(Math.floor(Math.random() * 1000000)),
        memory: this.simulateRealisticValue(50, 20, 10, 200),
        cpu: this.simulateRealisticValue(5, 3, 0, 15)
      }));
    } catch (error) {
      console.error('Failed to update service status:', error);
    }
  }

  private simulateRealisticValue(base: number, variance: number, min: number, max: number): number {
    const value = base + (Math.random() - 0.5) * variance * 2;
    return Math.max(min, Math.min(max, Math.round(value * 10) / 10));
  }

  private formatUptime(seconds: number): string {
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
  }

  public getMetrics(): SystemMetrics | null {
    return this.metrics;
  }

  public getServices(): ServiceStatus[] {
    return this.services;
  }

  public async executeCommand(command: string): Promise<{ output: string; error?: string }> {
    // In a real implementation, this would execute actual system commands
    // For demo purposes, we'll simulate command execution
    console.log(`Executing command: ${command}`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        switch (command.toLowerCase()) {
          case 'uptime':
            resolve({ output: `${this.formatUptime(this.metrics?.uptime || 0)} up, load average: ${this.metrics?.loadAverage.join(', ')}` });
            break;
          case 'df -h':
            resolve({ 
              output: `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   41G  7.2G  82% /`
            });
            break;
          case 'free -m':
            const memory = this.metrics?.memory;
            resolve({
              output: `              total        used        free\nMem:           ${Math.floor((memory?.total || 0) / 1024)}        ${Math.floor((memory?.used || 0) / 1024)}        ${Math.floor((memory?.free || 0) / 1024)}`
            });
            break;
          case 'ps aux | head -10':
            resolve({
              output: `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  19356  1544 ?        Ss   Dec01   0:01 /sbin/init\nroot         2  0.0  0.0      0     0 ?        S    Dec01   0:00 [kthreadd]`
            });
            break;
          default:
            resolve({ output: `Command '${command}' executed successfully.` });
        }
      }, 500 + Math.random() * 1000);
    });
  }
}

export const systemMonitor = SystemMonitor.getInstance();
