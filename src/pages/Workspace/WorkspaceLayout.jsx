import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from '../../components/TopNav';
import Sidebar from '../../components/Sidebar';
import useTaskStore from '../../store/useTaskStore';
import useDocumentStore from '../../store/useDocumentStore';

const WorkspaceLayout = () => {
  useEffect(() => {
    // Initial fetch
    useTaskStore.getState().fetchTasks();
    useDocumentStore.getState().fetchDocuments();
    
    // Auto-refresh (Polling) every 3 seconds for "real-time" feel across devices
    const intervalId = setInterval(() => {
      useTaskStore.getState().fetchTasks();
      useDocumentStore.getState().fetchDocuments();
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

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
