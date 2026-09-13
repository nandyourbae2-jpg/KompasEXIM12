import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import WorkspaceLayout from './pages/Workspace/WorkspaceLayout';
import TaskMap from './pages/Workspace/TaskMap';
import DokumenMonitoringLayout from './pages/Workspace/DokumenMonitoring/DokumenMonitoringLayout';
import DokumenMonitoringList from './pages/Workspace/DokumenMonitoring/DokumenMonitoringList';
import DokumenMonitoringDetail from './pages/Workspace/DokumenMonitoring/DokumenMonitoringDetail';
import PaymentDashboard from './pages/Workspace/Payment/PaymentDashboard';
import RealisasiDanaLayout from './pages/Workspace/Finance/RealisasiDana/RealisasiDanaLayout';
import DebitNoteMonitoring from './pages/Workspace/Finance/DebitNote/DebitNoteMonitoring';
import ManagerHome from './pages/Manager/ManagerHome';
import ManagerAoOverview from './pages/Manager/ManagerAoOverview';
import PlaceholderDashboard from './pages/Supervisor/PlaceholderDashboard';

import SupervisorDashboard from './pages/SupervisorDashboard';
import AoWorkboard from './pages/Staff/AoWorkboard';
import DscsWorkspace from './pages/Staff/DscsWorkspace';
import AoLogScheduleMonitoring from './pages/Workspace/AO/AoLogScheduleMonitoring';
import AoSettingSoTerms from './pages/Supervisor/AoSettingSoTerms';
import AoTaskMap from './pages/Workspace/AoTaskMap';

import SourceManagementPage from './pages/Workspace/SourceManagement/SourceManagementPage';
import ManagerImportOverview from './pages/Workspace/Management/Manager/ManagerImportOverview';
import ManagerStrategicAnalytics from './pages/Workspace/Management/Manager/ManagerStrategicAnalytics';
import ManagerExecutiveApproval from './pages/Workspace/Management/Manager/ManagerExecutiveApproval';
import AssignImportProject from './pages/Workspace/ImportProject/AssignImportProject';
import ImportOpsLayout from './pages/Workspace/ImportOps/ImportOpsLayout';
import ImportOpsList from './pages/Workspace/ImportOps/ImportOpsList';
import MasterDataPage from './pages/Workspace/ImportOps/MasterDataPage';
import ShipmentDetail from './pages/Workspace/ImportOps/ShipmentDetail';
import AnalysisRouter from './pages/Workspace/ImportOps/AnalysisRouter';
import PlanGDGPage from './pages/Workspace/ImportOps/PlanGDGPage';
import VendorManagementPage from './pages/Workspace/Vendor/VendorManagementPage';
import StatusShipmentRouter from './pages/Workspace/StatusShipment/StatusShipmentRouter';
import FinancialRequestList from './pages/Workspace/FinancialRequest/FinancialRequestList';
import FinancialRequestDetail from './pages/Workspace/FinancialRequest/FinancialRequestDetail';
import PibRequestList from './pages/Workspace/PibRequest/PibRequestList';
import PibRequestDetail from './pages/Workspace/PibRequest/PibRequestDetail';

import useAuthStore from './store/useAuthStore';
import { AppleModalProvider } from './contexts/AppleModalContext';
import { 
  isManager,
  isSupervisor, 
  canAccessOperationalWorkspace,
  canAccessFinanceAndVendor,
  canAccessImportModule,
  canAccessAnalysis,
  canAccessStatusShipment
} from './utils/authHelpers';

import { DEPARTMENT_FEATURES, COMMON_SUPERVISOR_MENU } from './config/departmentFeatures';
import * as SupervisorPages from './pages/Supervisor';
import * as StaffPages from './pages/Staff';

const DynamicSupervisorPage = () => {
  const { key } = useParams();
  const { user } = useAuthStore();

  const deptConfig = DEPARTMENT_FEATURES[user?.departemen] || {};
  const allMenu = [...COMMON_SUPERVISOR_MENU, ...(deptConfig.supervisorMenu || [])];
  const matchedItem = allMenu.find(m => m.key === key);

  if (!matchedItem) return <div style={{padding: '24px'}}>Halaman tidak ditemukan untuk departemen {user?.departemen}</div>;

  const Component = SupervisorPages[matchedItem.component];
  if (!Component) return <div style={{padding: '24px'}}>Komponen {matchedItem.component} belum dibuat</div>;

  return (
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  );
};

const DynamicStaffPage = () => {
  const { key } = useParams();
  const { user } = useAuthStore();

  const deptConfig = DEPARTMENT_FEATURES[user?.departemen] || {};
  const allMenu = deptConfig.staffMenu || [];
  
  let matchedItem = null;

  // SAFE REDIRECTS FOR AE DEPRECATED ROUTES
  if (user?.departemen === 'Administrasi Export' && ['dashboard', 'jobs', 'actions'].includes(key)) {
     return <Navigate to="/workspace/staff/workboard" replace />;
  }
  
  if (allMenu.length > 0 && allMenu[0].groupLabel) {
     for (const group of allMenu) {
        const found = group.items.find(m => m.key === key);
        if (found) {
           matchedItem = found;
           break;
        }
     }
  } else {
     matchedItem = allMenu.find(m => m.key === key);
  }


  if (!matchedItem) return <div style={{padding: '24px'}}>Halaman tidak ditemukan untuk departemen {user?.departemen}</div>;

  const Component = StaffPages[matchedItem.component];
  if (!Component) return <div style={{padding: '24px'}}>Komponen {matchedItem.component} belum dibuat</div>;

  return (
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  );
};

import { getToken } from './utils/authToken';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuthStore();
  const token = getToken();

  if (isLoading) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (!user) {
    return (
      <div style={{ padding: '2rem' }}>
        <h3>ProtectedRoute Redirect Triggered</h3>
        <p>User is null. Loading: {isLoading.toString()}</p>
        <button onClick={() => window.location.hash = '#/login'}>Go to Login</button>
      </div>
    );
  }
  return children;
}

function IndexRedirect() {
  const { user } = useAuthStore();
  if (isManager(user)) return <Navigate to="/workspace/manager" replace />;
  if (isSupervisor(user)) {
    if (user?.departemen === 'Administrasi Export') {
      return <Navigate to="/workspace/supervisor/dashboard" replace />;
    }
    if (user?.departemen === 'Account Officer') {
      return <Navigate to="/workspace/ao/supervisor" replace />;
    }
    return <Navigate to="/workspace/supervisor/dashboard-saya" replace />;
  }
  if (user?.departemen === 'Administrasi Export') return <Navigate to="/workspace/staff/workboard" replace />;
  if (user?.departemen === 'Account Officer') return <Navigate to="/workspace/ao/staff" replace />;
  if (canAccessOperationalWorkspace(user)) return <Navigate to="/workspace/tasks" replace />;
  return (
    <div style={{ padding: '2rem' }}>
      <h3>IndexRedirect Fallback</h3>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}

function ManagerRoute({ children }) {
  const { user } = useAuthStore();
  if (!isManager(user)) {
    return <Navigate to="/workspace" replace />;
  }
  return children;
}

function SupervisorRoute({ children }) {
  const { user } = useAuthStore();
  if (!isSupervisor(user)) {
    return <Navigate to="/workspace/tasks" replace />;
  }
  return children;
}

function OperationalRoute({ children }) {
  const { user } = useAuthStore();
  if (!canAccessOperationalWorkspace(user) && !isManager(user)) {
    return <Navigate to="/workspace/supervisor/dashboard-saya" replace />;
  }
  return children;
}

function FinanceVendorRoute({ children }) {
  const { user } = useAuthStore();
  if (!canAccessFinanceAndVendor(user)) {
    return <Navigate to={isSupervisor(user) ? "/workspace/supervisor/dashboard-saya" : "/workspace/tasks"} replace />;
  }
  return children;
}

function ImportRoute({ children }) {
  const { user } = useAuthStore();
  if (!canAccessImportModule(user)) {
    return <Navigate to={isSupervisor(user) ? "/workspace/supervisor/dashboard-saya" : "/workspace/tasks"} replace />;
  }
  return children;
}

function AnalysisRoute({ children }) {
  const { user } = useAuthStore();
  if (!canAccessAnalysis(user)) {
    return <Navigate to={isSupervisor(user) ? "/workspace/supervisor/dashboard-saya" : "/workspace/tasks"} replace />;
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
    <AppleModalProvider>
      <HashRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/workspace" element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>}>
              <Route index element={<IndexRedirect />} />
              
              {/* --- MANAGER (TOP MANAGEMENT) ROUTE --- */}
              <Route path="manager">
                <Route index element={<ManagerRoute><ErrorBoundary><ManagerHome /></ErrorBoundary></ManagerRoute>} />
                <Route path="import" element={<ManagerRoute><ErrorBoundary><ManagerImportOverview /></ErrorBoundary></ManagerRoute>} />
                <Route path="export" element={<ManagerRoute><PlaceholderDashboard title="Export Department" message="Executive dashboard departemen export sedang dalam pengembangan." /></ManagerRoute>} />
                <Route path="ae" element={<ManagerRoute><PlaceholderDashboard title="AE Department" message="Executive dashboard departemen administrasi export sedang dalam pengembangan." /></ManagerRoute>} />
                <Route path="ao" element={<ManagerRoute><ErrorBoundary><ManagerAoOverview /></ErrorBoundary></ManagerRoute>} />
                <Route path="source" element={<ManagerRoute><ErrorBoundary><SourceManagementPage /></ErrorBoundary></ManagerRoute>} />
                <Route path="analytics" element={<ManagerRoute><ManagerStrategicAnalytics /></ManagerRoute>} />
                <Route path="approvals" element={<ManagerRoute><ErrorBoundary><ManagerExecutiveApproval /></ErrorBoundary></ManagerRoute>} />
              </Route>
              
              {/* --- OPERATIONAL ROUTES --- */}
              <Route path="tasks" element={<OperationalRoute><ErrorBoundary><TaskMap /></ErrorBoundary></OperationalRoute>} />
              <Route path="documents" element={<Navigate to="/workspace/dokumen-monitoring" replace />} />
              
              {/* --- AO WORK MANAGEMENT ROUTES --- */}
              <Route path="ao/supervisor" element={<SupervisorRoute><ErrorBoundary><SupervisorDashboard /></ErrorBoundary></SupervisorRoute>} />
              <Route path="ao/log-schedule" element={<SupervisorRoute><ErrorBoundary><AoLogScheduleMonitoring /></ErrorBoundary></SupervisorRoute>} />
              <Route path="ao/setting-so-terms" element={<SupervisorRoute><ErrorBoundary><AoSettingSoTerms /></ErrorBoundary></SupervisorRoute>} />
              <Route path="ao/task-map" element={<OperationalRoute><ErrorBoundary><AoTaskMap /></ErrorBoundary></OperationalRoute>} />
              {/* Phase 13: New Bento Glassmorphic AO Staff Workboard */}
              <Route path="ao/staff" element={<OperationalRoute><ErrorBoundary><AoWorkboard /></ErrorBoundary></OperationalRoute>} />
              {/* Phase 13: DSCS Personal Workspace — strict RBAC for Erica */}
              <Route path="ao/dscs" element={<OperationalRoute><ErrorBoundary><DscsWorkspace /></ErrorBoundary></OperationalRoute>} />
              
              <Route path="dokumen-monitoring" element={<OperationalRoute><ErrorBoundary><DokumenMonitoringLayout /></ErrorBoundary></OperationalRoute>}>
                <Route index element={<DokumenMonitoringList />} />
                <Route path=":projectId" element={<DokumenMonitoringDetail />} />
              </Route>
              
              {/* --- FINANCE & VENDOR ROUTES --- */}
              <Route path="financial-request" element={<FinanceVendorRoute><ErrorBoundary><FinancialRequestList /></ErrorBoundary></FinanceVendorRoute>}>
                <Route path=":id" element={<ErrorBoundary><FinancialRequestDetail /></ErrorBoundary>} />
              </Route>
              <Route path="payments" element={<FinanceVendorRoute><ErrorBoundary><PaymentDashboard /></ErrorBoundary></FinanceVendorRoute>} />
              <Route path="realisasi-dana" element={<FinanceVendorRoute><ErrorBoundary><RealisasiDanaLayout /></ErrorBoundary></FinanceVendorRoute>} />
              <Route path="debit-notes" element={<FinanceVendorRoute><ErrorBoundary><DebitNoteMonitoring /></ErrorBoundary></FinanceVendorRoute>} />
              <Route path="vendors" element={<FinanceVendorRoute><ErrorBoundary><VendorManagementPage /></ErrorBoundary></FinanceVendorRoute>} />
              
              {/* --- STATUS SHIPMENT --- */}
              <Route path="status-shipment" element={<StatusShipmentRoute><ErrorBoundary><StatusShipmentRouter /></ErrorBoundary></StatusShipmentRoute>} />
              
              {/* --- IMPORT OPERATIONAL MODULE --- */}
              <Route element={<OperationalRoute><ImportOpsLayout /></OperationalRoute>}>
                <Route path="import-operational" element={<ErrorBoundary><ImportOpsList /></ErrorBoundary>} />
                <Route path="import-analysis" element={<ErrorBoundary><AnalysisRouter /></ErrorBoundary>} />
                <Route path="import-plangdg" element={<ErrorBoundary><PlanGDGPage /></ErrorBoundary>} />
                <Route path="import-master" element={<ErrorBoundary><MasterDataPage /></ErrorBoundary>} />
              </Route>

              {/* --- IMPORT OPERATIONAL --- */}
              <Route path="import-operational/:id" element={
                <OperationalRoute>
                  <ErrorBoundary>
                    <ShipmentDetail />
                  </ErrorBoundary>
                </OperationalRoute>
              } />

              {/* --- DYNAMIC ROUTES (REGISTRY BASED) --- */}
              <Route path="supervisor/:key" element={
                <SupervisorRoute>
                  <DynamicSupervisorPage />
                </SupervisorRoute>
              } />

              <Route path="staff/job-detail/:id" element={
                <OperationalRoute>
                  <ErrorBoundary>
                    <StaffPages.AeJobWorkbench />
                  </ErrorBoundary>
                </OperationalRoute>
              } />

              <Route path="staff/workboard" element={
                <OperationalRoute>
                  <ErrorBoundary>
                    <StaffPages.AeWorkboard />
                  </ErrorBoundary>
                </OperationalRoute>
              } />

              <Route path="staff/:key" element={
                <OperationalRoute>
                  <DynamicStaffPage />
                </OperationalRoute>
              } />

              {/* --- BACKWARD COMPATIBILITY REDIRECTS --- */}
              <Route path="staff/handover" element={<Navigate to="/workspace/staff/workboard?tab=expedisi" replace />} />

              <Route path="spv-import/my-dashboard" element={<Navigate to="/workspace/supervisor/dashboard-saya" replace />} />
              <Route path="spv-import/dashboard" element={<Navigate to="/workspace/supervisor/dashboard" replace />} />
              <Route path="spv-import/*" element={<Navigate to="/workspace/supervisor/dashboard-saya" replace />} />
              
              <Route path="spv-ao/approval" element={<Navigate to="/workspace/supervisor/approval" replace />} />
              <Route path="spv-ao/facility" element={<Navigate to="/workspace/supervisor/facility" replace />} />

              <Route path="ae/dashboard" element={<Navigate to="/workspace/staff/workboard" replace />} />
              <Route path="ae/administration" element={<Navigate to="/workspace/staff/administration" replace />} />
              <Route path="ae/documents" element={<Navigate to="/workspace/staff/documents" replace />} />
              <Route path="ae/follow-ups" element={<Navigate to="/workspace/staff/follow-ups" replace />} />
              <Route path="ae/issues" element={<Navigate to="/workspace/staff/issues" replace />} />
              <Route path="ae/activities" element={<Navigate to="/workspace/staff/activities" replace />} />

              <Route path="ao/dashboard" element={<Navigate to="/workspace/staff/dashboard" replace />} />
              <Route path="ao/lc" element={<Navigate to="/workspace/staff/lc" replace />} />
              <Route path="ao/bg" element={<Navigate to="/workspace/staff/bg" replace />} />
              <Route path="ao/kasbon" element={<Navigate to="/workspace/staff/kasbon" replace />} />
              <Route path="ao/fx" element={<Navigate to="/workspace/staff/fx" replace />} />
              <Route path="ao/tt" element={<Navigate to="/workspace/staff/tt" replace />} />
              <Route path="ao/master" element={<Navigate to="/workspace/staff/master" replace />} />

              <Route path="supervisor/control-tower" element={<Navigate to="/workspace/supervisor/dashboard" replace />} />
              
              {/* Global catch-all within workspace */}
              <Route path="*" element={<Navigate to="/workspace" replace />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
        <Toaster position="top-right" />
      </HashRouter>
    </AppleModalProvider>
  );
}

export default App;
