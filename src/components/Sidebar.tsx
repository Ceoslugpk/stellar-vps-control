
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Server, 
  Database, 
  Mail, 
  Shield, 
  Settings, 
  Folder,
  Archive,
  Wifi,
  Key,
  HardDrive,
  Globe,
  Users,
  BarChart,
  Terminal,
  Download,
  Upload,
  Lock,
  FileText,
  Clock,
  Zap
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Monitor },
    { id: 'vps-connection', label: 'VPS Connection', icon: Zap },
    { id: 'files', label: 'File Manager', icon: Folder },
    { id: 'ftp', label: 'FTP Management', icon: Upload },
    { id: 'databases', label: 'Databases', icon: Database },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'applications', label: 'Applications', icon: Download },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'ssl', label: 'SSL/TLS', icon: Key },
    { id: 'metrics', label: 'Metrics', icon: BarChart },
    { id: 'advanced', label: 'Advanced Tools', icon: Terminal },
    { id: 'backup', label: 'Backup', icon: Archive },
    { id: 'monitoring', label: 'Monitoring', icon: HardDrive },
    { id: 'network', label: 'Network', icon: Wifi },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-900">HostPanel Pro</h1>
        <p className="text-sm text-gray-600">Control Panel</p>
      </div>
      <nav className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onSectionChange(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};
