import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopNav from '../../components/TopNav';
import Sidebar from '../../components/Sidebar';
import useAuthStore from '../../store/useAuthStore';
import useTaskStore from '../../store/useTaskStore';
import useDocumentStore from '../../store/useDocumentStore';
import ErrorBoundary from '../../components/ErrorBoundary';

const WorkspaceLayout = () => {
  const location = useLocation();

  useEffect(() => {
    // Initial fetch
    useAuthStore.getState().fetchAllUsers();
    useTaskStore.getState().fetchTasks();
    useDocumentStore.getState().fetchDocuments();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopNav />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--color-canvas-parchment)' }}>
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
