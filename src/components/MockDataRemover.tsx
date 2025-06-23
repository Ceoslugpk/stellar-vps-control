
import { useEffect } from 'react';
import { vpsManager } from '@/lib/vpsManager';

export const MockDataRemover = () => {
  useEffect(() => {
    // Check if we're in production or installation completed
    const installationCompleted = localStorage.getItem('installation_completed') === 'true';
    const isProduction = import.meta.env.PROD;
    
    if (installationCompleted || isProduction) {
      // Remove all mock data
      const mockDataKeys = [
        'mockServices',
        'mockDomains',
        'mockDatabases',
        'mockSystemStats',
        'mockFTPAccounts',
        'mockEmailAccounts',
        'mockCronJobs',
        'mockApplications',
        'mockMetrics'
      ];

      mockDataKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // Enable real-time VPS integration
      vpsManager.enableRealTimeMode();
      
      console.log('Mock data removed - Real-time VPS integration enabled');
    }
  }, []);

  return null; // This component doesn't render anything
};
