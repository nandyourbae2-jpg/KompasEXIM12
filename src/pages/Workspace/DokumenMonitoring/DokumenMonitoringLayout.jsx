import React from 'react';
import { Outlet } from 'react-router-dom';

const DokumenMonitoringLayout = () => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Outlet />
    </div>
  );
};

export default DokumenMonitoringLayout;
