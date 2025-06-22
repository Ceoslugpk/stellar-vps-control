
import React from 'react';
import { SystemOverview } from './dashboard/SystemOverview';
import { DomainManagement } from './dashboard/DomainManagement';
import { DatabaseManagement } from './dashboard/DatabaseManagement';
import { EmailManagement } from './dashboard/EmailManagement';
import { FileManager } from './dashboard/FileManager';
import { SecurityManagement } from './dashboard/SecurityManagement';
import { SSLManagement } from './dashboard/SSLManagement';
import { BackupManagement } from './dashboard/BackupManagement';
import { MonitoringDashboard } from './dashboard/MonitoringDashboard';
import { NetworkManagement } from './dashboard/NetworkManagement';
import { SettingsPanel } from './dashboard/SettingsPanel';

interface DashboardProps {
  activeSection: string;
}

export const Dashboard = ({ activeSection }: DashboardProps) => {
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <SystemOverview />;
      case 'domains':
        return <DomainManagement />;
      case 'databases':
        return <DatabaseManagement />;
      case 'email':
        return <EmailManagement />;
      case 'files':
        return <FileManager />;
      case 'security':
        return <SecurityManagement />;
      case 'ssl':
        return <SSLManagement />;
      case 'backup':
        return <BackupManagement />;
      case 'monitoring':
        return <MonitoringDashboard />;
      case 'network':
        return <NetworkManagement />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <SystemOverview />;
    }
  };

  return <div className="space-y-6">{renderSection()}</div>;
};
