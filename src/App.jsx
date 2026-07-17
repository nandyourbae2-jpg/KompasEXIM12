import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import WorkspaceLayout from './pages/Workspace/WorkspaceLayout';
import TaskMap from './pages/Workspace/TaskMap';
import DocumentMap from './pages/Workspace/DocumentMap';
import PaymentDashboard from './pages/Workspace/Payment/PaymentDashboard';
import DashboardRouter from './pages/Supervisor/DashboardRouter';
import StaffManagementPage from './pages/Supervisor/StaffManagementPage';
import ManagerHome from './pages/Manager/ManagerHome';
import ManagerImportReport from './pages/Manager/ManagerImportReport';
import PlaceholderDashboard from './pages/Supervisor/PlaceholderDashboard';
import AssignImportProject from './pages/Workspace/ImportProject/AssignImportProject';
import ImportOpsLayout from './pages/Workspace/ImportOps/ImportOpsLayout';
import ImportOpsList from './pages/Workspace/ImportOps/ImportOpsList';
import MasterDataPage from './pages/Workspace/ImportOps/MasterDataPage';
import ShipmentDetail from './pages/Workspace/ImportOps/ShipmentDetail';
import AnalysisRouter from './pages/Workspace/ImportOps/AnalysisRouter';
import PlanGDGPage from './pages/Workspace/ImportOps/PlanGDGPage';
import VendorManagementPage from './pages/Workspace/Vendor/VendorManagementPage';
import StatusShipmentRouter from './pages/Workspace/StatusShipment/StatusShipmentRouter';
import useAuthStore from './store/useAuthStore';
import { 
  isManager,
  isSupervisor, 
  canAccessOperationalWorkspace,
  canAccessFinanceAndVendor,
  canAccessImportModule,
  canAccessAnalysis,
  canAccessStatusShipment
} from './utils/authHelpers';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function IndexRedirect() {
  const { user } = useAuthStore();
  if (isManager(user)) return <Navigate to="/workspace/manager" replace />;
  if (isSupervisor(user)) return <Navigate to="/workspace/dashboard" replace />;
  if (canAccessOperationalWorkspace(user)) return <Navigate to="/workspace/tasks" replace />;
  return <Navigate to="/login" replace />;
}

// Hanya untuk Manager (Top Management)
function ManagerRoute({ children }) {
  const { user } = useAuthStore();
  if (!isManager(user)) {
    return <Navigate to="/workspace" replace />;
  }
  return children;
}

// Hanya untuk Supervisor
function SupervisorRoute({ children }) {
  const { user } = useAuthStore();
  if (!isSupervisor(user)) {
    return <Navigate to="/workspace/tasks" replace />;
  }
  return children;
}

// Hanya untuk Operational
function OperationalRoute({ children }) {
  const { user } = useAuthStore();
  if (!canAccessOperationalWorkspace(user) && !isManager(user)) {
    return <Navigate to="/workspace/dashboard" replace />;
  }
  return children;
}

function FinanceVendorRoute({ children }) {
  const { user } = useAuthStore();
  if (!canAccessFinanceAndVendor(user)) {
    return <Navigate to={isSupervisor(user) ? "/workspace/dashboard" : "/workspace/tasks"} replace />;
  }
  return children;
}

function ImportRoute({ children }) {
  const { user } = useAuthStore();
  if (!canAccessImportModule(user)) {
    return <Navigate to={isSupervisor(user) ? "/workspace/dashboard" : "/workspace/tasks"} replace />;
  }
  return children;
}

function AnalysisRoute({ children }) {
  const { user } = useAuthStore();
  if (!canAccessAnalysis(user)) {
    return <Navigate to={isSupervisor(user) ? "/workspace/dashboard" : "/workspace/tasks"} replace />;
  }
  return children;
}

function StatusShipmentRoute({ children }) {
  const { user } = useAuthStore();
  if (!canAccessStatusShipment(user)) {
    return <Navigate to="/workspace/tasks" replace />;
  }
  return children;
}

function App() {
  const checkSession = useAuthStore(state => state.checkSession);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    checkSession().finally(() => setSessionChecked(true));
  }, []);

  if (!sessionChecked) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/workspace" element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>}>
          <Route index element={<IndexRedirect />} />
          
          {/* --- MANAGER (TOP MANAGEMENT) ROUTE --- */}
          <Route path="manager">
            <Route index element={<ManagerRoute><ManagerHome /></ManagerRoute>} />
            <Route path="import" element={<ManagerRoute><ManagerImportReport /></ManagerRoute>} />
            <Route path="export" element={<ManagerRoute><PlaceholderDashboard title="Laporan Departemen Export akan segera tersedia" message="Fitur pelaporan eksekutif untuk departemen ini sedang dalam pengembangan." /></ManagerRoute>} />
            <Route path="ae" element={<ManagerRoute><PlaceholderDashboard title="Laporan Administrasi Export akan segera tersedia" message="Fitur pelaporan eksekutif untuk departemen ini sedang dalam pengembangan." /></ManagerRoute>} />
            <Route path="ao" element={<ManagerRoute><PlaceholderDashboard title="Laporan Account Officer akan segera tersedia" message="Fitur pelaporan eksekutif untuk departemen ini sedang dalam pengembangan." /></ManagerRoute>} />
          </Route>
          
          {/* --- OPERATIONAL ROUTES --- */}
          <Route path="tasks" element={<OperationalRoute><TaskMap /></OperationalRoute>} />
          <Route path="documents" element={<OperationalRoute><DocumentMap /></OperationalRoute>} />
          
          <Route path="payments" element={<FinanceVendorRoute><PaymentDashboard /></FinanceVendorRoute>} />
          <Route path="vendors" element={<FinanceVendorRoute><VendorManagementPage /></FinanceVendorRoute>} />
          
          <Route path="import-project" element={<ImportRoute><AssignImportProject /></ImportRoute>} />
          <Route element={<ImportRoute><ImportOpsLayout /></ImportRoute>}>
            <Route path="import-operational" element={<ImportOpsList />} />
            <Route path="import-operational/:id" element={<ShipmentDetail />} />
            <Route path="import-master" element={<MasterDataPage />} />
            <Route path="import-plangdg" element={<PlanGDGPage />} />
          </Route>

          {/* --- SHARED / SUPERVISOR ROUTES --- */}
          <Route path="dashboard" element={<SupervisorRoute><DashboardRouter /></SupervisorRoute>} />
          <Route path="staff-management" element={<SupervisorRoute><StaffManagementPage /></SupervisorRoute>} />
          <Route path="status-shipment" element={<StatusShipmentRoute><StatusShipmentRouter /></StatusShipmentRoute>} />
          
          {/* Analysis: Tumpang tindih antara Import dan Supervisor */}
          <Route element={<AnalysisRoute><ImportOpsLayout /></AnalysisRoute>}>
            <Route path="import-analysis" element={<AnalysisRouter />} />
          </Route>
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
