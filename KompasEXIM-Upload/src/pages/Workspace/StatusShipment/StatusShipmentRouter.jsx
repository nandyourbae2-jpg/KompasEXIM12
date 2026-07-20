import React from 'react';
import useAuthStore from '../../../store/useAuthStore';
import StatusShipmentPage from './StatusShipmentPage';
import PlaceholderDashboard from '../../Supervisor/PlaceholderDashboard';
import { getSupervisorPageTitle, isManager, isSupervisor } from '../../../utils/authHelpers';

const StatusShipmentRouter = () => {
  const { user } = useAuthStore();
  
  // Manager atau Supervisor tanpa departemen spesifik (mengawasi semua)
  // atau user yang spesifik di departemen Import berhak melihat halaman ini.
  if (isManager(user) || (isSupervisor(user) && !user?.departemen) || user?.departemen === 'Import') {
    return <StatusShipmentPage />;
  }
  
  if (user?.departemen === 'Export') {
    const title = getSupervisorPageTitle('Status Shipment', user);
    return (
      <PlaceholderDashboard 
        title={title}
        message="Fitur ini akan aktif setelah modul Export Operational dibangun." 
      />
    );
  }
  
  // Account Officer & Admin Export disembunyikan dari sidebar, 
  // tapi jika diakses manual via URL, kembalikan null atau placeholder.
  return null; 
};

export default StatusShipmentRouter;
