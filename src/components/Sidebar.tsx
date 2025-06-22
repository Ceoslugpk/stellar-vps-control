
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
  Hard Drive
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Monitor },
    { id: 'domains', label: 'Domains', icon: Server },
    { id: 'databases', label: 'Databases', icon: Database },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'files', label: 'File Manager', icon: Folder },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'ssl', label: 'SSL/TLS', icon: Key },
    { id: 'backup', label: 'Backup', icon: Archive },
    { id: 'monitoring', label: 'Monitoring', icon: Hard Drive },
    { id: 'network', label: 'Network', icon: Wifi },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
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
