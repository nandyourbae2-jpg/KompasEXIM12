import React from 'react';
import useAuthStore from '../../../store/useAuthStore';
import AnalysisPage from './AnalysisPage';
import PlaceholderDashboard from '../../Supervisor/PlaceholderDashboard';
import { getSupervisorPageTitle } from '../../../utils/authHelpers';

const AnalysisRouter = () => {
  const { user } = useAuthStore();
  
  if (user?.departemen === 'Import') {
    return <AnalysisPage />;
  }
  
  // Untuk departemen selain Import (Export, AO, AE)
  const title = getSupervisorPageTitle('Analysis', user);
  return (
    <PlaceholderDashboard 
      title={title}
      message="Analisis untuk departemen ini akan segera tersedia." 
    />
  );
};

export default AnalysisRouter;
