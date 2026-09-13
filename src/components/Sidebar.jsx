import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { DEPARTMENT_FEATURES, COMMON_SUPERVISOR_MENU, getCoreOperationalMenu } from '../config/departmentFeatures';
import {
  isManager,
  isSupervisor,
  canAccessFinanceAndVendor,
  getUserDisplayLabel
} from '../utils/authHelpers';
import {
  LayoutDashboard, User, Package, Ship, DollarSign, Store, BarChart2, ShieldCheck, FileText, Zap, ClipboardList, Database, AlertCircle
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  const isMgr = isManager(user);
  const isSup = isSupervisor(user);
  const showFinanceVendor = canAccessFinanceAndVendor(user);
  const displayLabel = getUserDisplayLabel(user);

  // 1. Dapatkan config departemen saat ini dari registry
  // Jika manager tidak punya departemen spesifik, biarkan kosong atau default
  const deptConfig = DEPARTMENT_FEATURES[user.departemen] || { label: user.departemen || 'General', supervisorMenu: [], staffMenu: [] };

  // 2. Susun Menu Berdasarkan Role
  const isAeSup = isSup && user?.departemen === 'Administrasi Export';
  const isAoSup = isSup && user?.departemen === 'Account Officer';
  
  let myWorkspaceSpv = [];
  let teamControlSpv = [];
  let teamControlLabel = `TEAM CONTROL TOWER (${deptConfig.label})`;

  if (isAeSup) {
    myWorkspaceSpv = [
      { key: 'dashboard', label: 'AE Control Tower', component: 'AeControlTower', icon: <LayoutDashboard size={18} /> }
    ];
    teamControlSpv = [
      { key: 'source', label: 'Log Schedule Source', component: 'SourceManagementPage', icon: <Database size={18} /> },
      { key: 'match-review', label: 'Match Review Center', component: 'MatchReviewCenter', icon: <AlertCircle size={18} /> }
    ];
    teamControlLabel = 'SOURCE / TEAM CONTROL';
  } else if (isAoSup) {
    myWorkspaceSpv = []; // Sembunyikan MY WORKSPACE untuk SPV AO
    teamControlSpv = deptConfig.supervisorMenu;
  } else if (isSup) {
    myWorkspaceSpv = COMMON_SUPERVISOR_MENU;
    teamControlSpv = deptConfig.supervisorMenu;
  }
  
  const coreOperational = getCoreOperationalMenu(user);
  let staffMenu = (!isSup && !isMgr) ? deptConfig.staffMenu : [];

  // Filter RBAC: Only Erica (scope:DSCS) can see the DSCS Workspace menu
  if (staffMenu && staffMenu.length > 0) {
    const isDscsScope = user?.personal_notes === 'scope:DSCS' || user?.employee_id === 'DSCS-01';
    staffMenu = staffMenu.filter(item => {
      if (item.key === 'dscs-workspace' && !isDscsScope) return false;
      return true;
    });
  }

  // Menu Khusus Manager
  const managerExecutiveItems = [
    { key: 'executive', name: 'Executive Dashboard', path: '/workspace/manager', icon: <LayoutDashboard size={18} /> },
    { key: 'analytics', name: 'Strategic Analytics', path: '/workspace/manager/analytics', icon: <BarChart2 size={18} /> },
    { key: 'approvals', name: 'Executive Approval', path: '/workspace/manager/approvals', icon: <ShieldCheck size={18} /> },
  ];
  
  const managerDepartmentItems = [
    { key: 'm-ao', name: 'AO Department', path: '/workspace/manager/ao', icon: <DollarSign size={18} /> },
    { key: 'm-imp', name: 'Import Department', path: '/workspace/manager/import', icon: <Ship size={18} /> },
    { key: 'm-ae', name: 'AE Department', path: '/workspace/manager/ae', icon: <FileText size={18} /> },
    { key: 'm-exp', name: 'Export Department', path: '/workspace/manager/export', icon: <Package size={18} /> },
  ];

  const managerSourceItems = [
    { key: 'm-src', name: 'Log Schedule Source', path: '/workspace/manager/source', icon: <Database size={18} /> },
  ];

  const financeVendorItems = [
    { key: 'fin-req', name: 'Financial Commitment Workspace', path: '/workspace/financial-request', icon: <ClipboardList size={18} /> },
    { key: 'fin-pay', name: 'Financial Payment Tracker', path: '/workspace/payments', icon: <DollarSign size={18} /> },
    { key: 'realisasi', name: 'Realisasi Dana Import', path: '/workspace/realisasi-dana', icon: <ClipboardList size={18} /> },
    { key: 'debit', name: 'Debit Note Monitoring', path: '/workspace/debit-notes', icon: <Zap size={18} /> },
    { key: 'vendor', name: 'Manajemen Vendor', path: '/workspace/vendors', icon: <Store size={18} /> },
  ];

  const renderNavGroup = (title, items, isMgrGroup = false, pathPrefix = '') => {
    if (!items || items.length === 0) return null;
    
    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-48)',
          marginBottom: '8px', marginLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {items.map(item => {
            // Jika item punya path (hardcoded manager/finance), gunakan. 
            // Jika punya key (dari registry), buat path dinamis
            const targetPath = item.path || `/workspace/${pathPrefix}/${item.key}`;
            
            return (
              <NavLink
                key={item.key || item.path}
                to={targetPath}
                end={isMgrGroup && targetPath === '/workspace/manager'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: 'var(--rounded-md)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-ink)',
                  backgroundColor: isActive ? 'var(--color-status-info-bg)' : 'transparent',
                  fontWeight: isActive ? '600' : '400', fontSize: '14px', textDecoration: 'none',
                  transition: 'background-color 0.15s, color 0.15s',
                  borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                })}
                onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.backgroundColor = 'var(--color-divider-soft)'; }}
                onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span>{item.name || item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: '260px', backgroundColor: 'var(--color-canvas-parchment)',
      borderRight: '1px solid var(--color-hairline)', display: 'flex', flexDirection: 'column',
      height: '100%', flexShrink: 0,
    }}>
      {/* Logo / Brand */}
      <div style={{ padding: '20px var(--spacing-md) 16px', borderBottom: '1px solid var(--color-hairline)' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)', letterSpacing: '-0.374px' }}>
          Kompas <span style={{ color: 'var(--color-primary)' }}>EXIM</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '2px' }}>
          Platform Manajemen Ekspor–Impor
        </div>
      </div>

      {/* Nav Items */}
      <div style={{ padding: 'var(--spacing-md) var(--spacing-sm)', flex: 1, overflowY: 'auto' }}>
        {isMgr ? (
          <>
            {renderNavGroup('High-Level Overview', managerExecutiveItems, true)}
            {renderNavGroup('Department Overview', managerDepartmentItems, false)}
            {renderNavGroup('Source Management', managerSourceItems, false)}
          </>
        ) : isSup ? (
          <>
            {renderNavGroup('MY WORKSPACE', myWorkspaceSpv, false, 'supervisor')}
            {renderNavGroup(teamControlLabel, teamControlSpv, false, 'supervisor')}
          </>
        ) : (
          <>
            {renderNavGroup('Navigasi Utama', coreOperational, false, 'staff')}
            {
               // If staffMenu contains groupLabel, render them as separate groups, else render as flat
               staffMenu.length > 0 && staffMenu[0].groupLabel 
                 ? staffMenu.map(group => renderNavGroup(group.groupLabel, group.items, false, 'staff'))
                 : renderNavGroup(`WORKSPACE ${deptConfig.label}`, staffMenu, false, 'staff')
            }
            {showFinanceVendor && renderNavGroup('Finansial & Relasi', financeVendorItems)}
          </>
        )}
      </div>

      {/* Footer: User Info */}
      <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', borderTop: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            backgroundColor: user?.level_otoritas === 'Manager' ? 'var(--color-primary)' : user?.level_otoritas === 'Supervisor' ? '#34c759' : 'var(--color-ink-muted-48)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background-color 0.2s',
          }}>
            <User size={16} color="#fff" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
