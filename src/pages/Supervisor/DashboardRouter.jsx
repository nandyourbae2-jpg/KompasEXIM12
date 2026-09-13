import React from 'react';
import useAuthStore from '../../store/useAuthStore';
import ControlTowerDashboard from './ControlTower';

const DashboardRouter = () => {
  const { user } = useAuthStore();
  
  return <ControlTowerDashboard />;
};

export default DashboardRouter;
