import React from 'react';
import {
  LayoutDashboard, Layers, Users, Ship, Package, DollarSign, Store, Bell, User, BarChart2,
  CheckSquare, FileText, Database, Map, PhoneCall, AlertOctagon, History, ShieldCheck, Settings, Calendar,
  Grid, Briefcase, Fish
} from 'lucide-react';

// Registry ini adalah SATU-SATUNYA sumber kebenaran untuk menentukan
// menu apa saja yang muncul di sidebar per departemen, dan komponen
// apa yang di-render untuk tiap menu.

export const DEPARTMENT_FEATURES = {
  'Import': {
    label: 'Import',
    supervisorMenu: [
      { key: 'dashboard', label: 'Department Dashboard', component: 'DepartmentDashboard', icon: <LayoutDashboard size={18} /> },
      { key: 'assignment', label: 'Assignment Center', component: 'AssignmentCenter', icon: <Users size={18} /> },
      { key: 'shipments', label: 'Shipment Monitoring', component: 'ShipmentMonitoring', icon: <Ship size={18} /> },
      { key: 'operations', label: 'Operational Monitoring', component: 'OperationalMonitoring', icon: <Package size={18} /> },
      { key: 'finance', label: 'Financial Monitoring', component: 'FinancialMonitoring', icon: <DollarSign size={18} /> },
      { key: 'vendor', label: 'Vendor Monitoring', component: 'VendorMonitoring', icon: <Store size={18} /> },
      { key: 'issues', label: 'Issue & Escalation', component: 'IssueEscalation', icon: <Bell size={18} /> },
      { key: 'performance', label: 'Staff Performance', component: 'StaffPerformance', icon: <User size={18} /> },
      { key: 'analytics', label: 'Analytics & Reports', component: 'AnalyticsReports', icon: <BarChart2 size={18} /> },
    ],
    staffMenu: [
      { key: 'assign-import-project', label: 'Assign Import Project', component: 'AssignImportProject', icon: <Package size={18} /> },
      { key: 'pib-request', label: 'PIB Request', component: 'PibRequestList', icon: <FileText size={18} /> },
      { key: 'import-operational', label: 'Import Operational', component: 'ImportOpsList', path: '/workspace/import-operational', icon: <Ship size={18} /> },
      { key: 'import-analysis', label: 'Analysis', component: 'AnalysisRouter', path: '/workspace/import-analysis', icon: <BarChart2 size={18} /> },
      { key: 'import-plangdg', label: 'PlanGDG', component: 'PlanGDGPage', path: '/workspace/import-plangdg', icon: <Calendar size={18} /> },
      { key: 'import-master', label: 'Master Data Import', component: 'MasterDataPage', path: '/workspace/import-master', icon: <Settings size={18} /> },
    ],
  },

  'Administrasi Export': {
    label: 'Administrasi Export (AE)',
    supervisorMenu: [
      { key: 'dashboard', label: 'AE Control Tower', component: 'AeControlTower', icon: <LayoutDashboard size={18} /> },
      { key: 'ae-assignment', label: 'AE Assignment Board', component: 'AeAssignmentBoard', icon: <Users size={18} /> },
      { key: 'source', label: 'Log Schedule Source', component: 'SourceManagementPage', icon: <Database size={18} /> },
      { key: 'match-review', label: 'Match Review Center', component: 'MatchReviewCenter', icon: <AlertOctagon size={18} /> },
    ],
    staffMenu: [
      {
        groupLabel: "WORK",
        items: [
           { key: 'workboard', label: 'AE Workboard', component: 'AeWorkboard', icon: <Grid size={18} /> },
        ]
      },
      {
        groupLabel: "OPERATIONS",
        items: [
           { key: 'documents', label: 'Documents', component: 'AeDocuments', icon: <FileText size={18} /> },
           { key: 'waiting', label: 'Waiting / Blocked', component: 'AeWaiting', icon: <AlertOctagon size={18} /> },
        ]
      },
      {
        groupLabel: "REFERENCE",
        items: [
           { key: 'history', label: 'Activity History', component: 'AeHistory', icon: <History size={18} /> },
        ]
      },
      {
        groupLabel: "SYSTEM",
        items: [
           { key: 'notifications', label: 'Notifications', component: 'AeNotifications', icon: <Bell size={18} /> },
        ]
      }
    ],
  },

  'Account Officer': {
    label: 'Account Officer (AO)',
    supervisorMenu: [
      { key: 'control-tower', name: 'AO Control Tower', path: '/workspace/ao/supervisor', icon: <LayoutDashboard size={18} /> },
      { key: 'setting-so-terms', name: 'Setting SO Terms', label: 'Setting SO Terms', path: '/workspace/ao/setting-so-terms', icon: <FileText size={18} /> },
      { key: 'task-map', name: 'Peta Tugas AO', path: '/workspace/ao/task-map', icon: <Map size={18} /> },
      { key: 'log-schedule', name: 'Log Schedule Monitoring', path: '/workspace/ao/log-schedule', icon: <Database size={18} /> }
    ],
    staffMenu: [
      { key: 'workboard', name: 'AO Workboard', path: '/workspace/ao/staff', icon: <Briefcase size={18} /> },
      { key: 'task-map', name: 'Peta Tugas AO', path: '/workspace/ao/task-map', icon: <Map size={18} /> },
      {
        key: 'dscs-workspace',
        name: 'DSCS Workspace',
        path: '/workspace/ao/dscs',
        icon: <Fish size={18} />,
        badge: 'Erica',
        description: 'Bilik kerja personal DSCS'
      }
    ],
  },

  'Export': {
    label: 'Export',
    supervisorMenu: [],
    staffMenu: [],
  },
};

// Menu yang SAMA untuk semua departemen (generik, tidak perlu didaftarkan per dept)
export const COMMON_SUPERVISOR_MENU = [
  { key: 'dashboard-saya', label: 'Dashboard Saya', component: 'DashboardSaya', icon: <LayoutDashboard size={18} /> },
  { key: 'my-tasks', label: 'My Tasks', component: 'MyTasksPersonal', icon: <CheckSquare size={18} /> },
  { key: 'approval', label: 'Approval Center', component: 'ApprovalCenter', icon: <CheckSquare size={18} /> },
  { key: 'notes', label: 'My Notes', component: 'MyNotes', icon: <FileText size={18} /> },
];

const coreOperationalItems = [
  { key: 'tasks', label: 'Peta Tugas', component: 'TaskMap', path: '/workspace/tasks', icon: <Map size={18} /> },
  { key: 'dokumen-monitoring', label: 'Dokumen Monitoring', component: 'DokumenMonitoringLayout', path: '/workspace/dokumen-monitoring', icon: <FileText size={18} /> },
];

export const getCoreOperationalMenu = (user) => {
  // Hanya jika AE atau AO jangan tampilkan yang generic jika mereka punya custom?
  // Tapi sesuai logic lama, AE dan AO punya custom `tasks`. 
  // Biarkan kosong untuk sementara atau return jika bukan AE/AO.
  if (user?.departemen === 'Administrasi Export' || user?.departemen === 'Account Officer') return [];
  return coreOperationalItems;
};
