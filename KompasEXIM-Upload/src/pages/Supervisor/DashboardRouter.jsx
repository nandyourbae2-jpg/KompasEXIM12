import React from 'react';
import useAuthStore from '../../store/useAuthStore';
import ImportSupervisorDashboard from './ImportSupervisorDashboard';
import PlaceholderDashboard from './PlaceholderDashboard';

const DashboardRouter = () => {
  const { user } = useAuthStore();
  
  return <ImportSupervisorDashboard />;
};

export default DashboardRouter;
