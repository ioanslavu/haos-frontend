import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardOverview } from './components/DashboardOverview';

const Dashboard = () => {
  return (
    <AppLayout>
      <DashboardOverview />
    </AppLayout>
  );
};

export default Dashboard;