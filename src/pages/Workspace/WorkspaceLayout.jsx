import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from '../../components/TopNav';
import Sidebar from '../../components/Sidebar';

const WorkspaceLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopNav />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--color-canvas)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
