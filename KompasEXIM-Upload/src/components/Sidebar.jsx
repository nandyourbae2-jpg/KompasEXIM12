import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import {
  isManager,
  isSupervisor,
  canAccessFinanceAndVendor,
  canAccessImportModule,
  getUserDisplayLabel,
  getSupervisorPageTitle
} from '../utils/authHelpers';
import {
  Map, FileText, DollarSign, LayoutDashboard, User, Users,
  Package, Ship, BarChart2, Calendar, Settings, Store, CheckSquare,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuthStore();

  const isMgr = isManager(user);
  const isSup = isSupervisor(user);
  const showFinanceVendor = canAccessFinanceAndVendor(user);
  const showImportModule = canAccessImportModule(user);
  const displayLabel = getUserDisplayLabel(user);

  // --- MENU GRUPS ---

  // 1. Grup Supervisor EXIM (Ranah Pengawasan)
  const baseSupervisorItems = [
    { name: 'Control Tower', path: '/workspace/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Peta Tugas', path: '/workspace/tasks', icon: <Map size={18} /> },
    { name: 'Manajemen Staff', path: '/workspace/staff-management', icon: <Users size={18} /> },
    // Status Shipment dihandle secara kondisional di bawah
    { name: 'Analysis', path: '/workspace/import-analysis', icon: <BarChart2 size={18} /> },
  ];

  const supervisorItems = [];
  baseSupervisorItems.forEach(item => {
    supervisorItems.push({
      ...item,
      name: getSupervisorPageTitle(item.name, user)
    });
  });

  // Sisipkan Status Shipment hanya untuk Import & Export
  if (user?.departemen === 'Import' || user?.departemen === 'Export') {
    supervisorItems.splice(1, 0, {
      name: getSupervisorPageTitle('Status Shipment', user),
      path: '/workspace/status-shipment',
      icon: <CheckSquare size={18} />
    });
  }

  // 2. Grup Operasional Inti (Semua 4 Dept)
  const coreOperationalItems = [
    { name: 'Peta Tugas', path: '/workspace/tasks', icon: <Map size={18} /> },
    { name: 'Manajemen Dokumen', path: '/workspace/documents', icon: <FileText size={18} /> },
  ];

  // 3. Grup Finansial & Vendor (Import & Export)
  const financeVendorItems = [
    { name: 'Monitoring Pembayaran', path: '/workspace/payments', icon: <DollarSign size={18} /> },
    { name: 'Manajemen Vendor', path: '/workspace/vendors', icon: <Store size={18} /> },
  ];

  // 4. Grup Import Khusus (Hanya Import)
  const importItems = [
    { name: 'Assign Import Project', path: '/workspace/import-project', icon: <Package size={18} /> },
    { name: 'Import Operational', path: '/workspace/import-operational', icon: <Ship size={18} /> },
    { name: 'Analysis', path: '/workspace/import-analysis', icon: <BarChart2 size={18} /> },
    { name: 'PlanGDG', path: '/workspace/import-plangdg', icon: <Calendar size={18} /> },
    { name: 'Master Data Import', path: '/workspace/import-master', icon: <Settings size={18} /> },
  ];

  // 5. Grup Manager (Top Management)
  const managerItems = [
    { name: 'Dasbor Utama', path: '/workspace/manager', icon: <LayoutDashboard size={18} /> },
    { name: 'Peta Tugas', path: '/workspace/tasks', icon: <Map size={18} /> },
    { name: 'Import', path: '/workspace/manager/import', icon: <Ship size={18} /> },
    { name: 'Export', path: '/workspace/manager/export', icon: <Package size={18} /> },
    { name: 'Administrasi Export', path: '/workspace/manager/ae', icon: <FileText size={18} /> },
    { name: 'Account Officer', path: '/workspace/manager/ao', icon: <DollarSign size={18} /> },
  ];

  const renderNavGroup = (title, items, isMgrGroup = false) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        color: 'var(--color-ink-muted-48)',
        marginBottom: '8px',
        marginLeft: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={isMgrGroup && item.path === '/workspace/manager'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: 'var(--rounded-md)',
              color: isActive ? 'var(--color-primary)' : 'var(--color-ink)',
              backgroundColor: isActive ? 'var(--color-status-info-bg)' : 'transparent',
              fontWeight: isActive ? '600' : '400',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'background-color 0.15s, color 0.15s',
              borderLeft: isActive
                ? '3px solid var(--color-primary)'
                : '3px solid transparent',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'var(--color-divider-soft)';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      width: '260px',
      backgroundColor: 'var(--color-canvas-parchment)',
      borderRight: '1px solid var(--color-hairline)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
    }}>
      {/* Logo / Brand */}
      <div style={{
        padding: '20px var(--spacing-md) 16px',
        borderBottom: '1px solid var(--color-hairline)',
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--color-ink)',
          letterSpacing: '-0.374px',
        }}>
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
            {renderNavGroup('Kontrol Departemen', managerItems, true)}
          </>
        ) : isSup ? (
          <>
            {renderNavGroup('Pengawasan (Supervisor)', supervisorItems)}
          </>
        ) : (
          <>
            {renderNavGroup('Navigasi Utama', coreOperationalItems)}
            {showFinanceVendor && renderNavGroup('Finansial & Relasi', financeVendorItems)}
            {showImportModule && renderNavGroup('Modul Import', importItems)}
          </>
        )}
      </div>

      {/* Footer: User Info */}
      <div style={{
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderTop: '1px solid var(--color-hairline)',
        backgroundColor: 'var(--color-canvas)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            borderRadius: '50%',
            backgroundColor: user?.level_otoritas === 'Manager'
              ? 'var(--color-primary)'
              : user?.level_otoritas === 'Supervisor'
                ? '#34c759'
                : 'var(--color-ink-muted-48)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background-color 0.2s',
          }}>
            <User size={16} color="#fff" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--color-ink)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--color-ink-muted-48)',
              marginTop: '1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {displayLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
