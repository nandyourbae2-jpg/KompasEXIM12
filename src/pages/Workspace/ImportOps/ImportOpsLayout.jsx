import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Ship, BarChart2, Calendar, Settings } from 'lucide-react';

/**
 * ImportOpsLayout
 *
 * Layout wrapper untuk semua halaman modul Import Operational.
 * Menampilkan sub-nav horizontal di bawah header utama workspace.
 * <Outlet /> merender konten halaman aktif.
 */
const ImportOpsLayout = () => {
  const subNavItems = [
    { name: 'Shipment List', path: '/workspace/import-operational', icon: <Ship size={15} />, end: true },
    { name: 'Analysis', path: '/workspace/import-analysis', icon: <BarChart2 size={15} /> },
    { name: 'PlanGDG', path: '/workspace/import-plangdg', icon: <Calendar size={15} /> },
    { name: 'Master Data', path: '/workspace/import-master', icon: <Settings size={15} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Sub-navigation bar */}
      <div style={{
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        padding: '0 32px',
        display: 'flex',
        gap: '4px',
        flexShrink: 0,
        alignItems: 'flex-end',
        height: '44px',
      }}>
        {subNavItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 14px',
              height: '44px',
              fontSize: '13px',
              fontWeight: isActive ? '600' : '400',
              color: isActive ? 'var(--color-primary)' : 'var(--color-ink-muted-80)',
              textDecoration: 'none',
              borderBottom: isActive
                ? '2px solid var(--color-primary)'
                : '2px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            })}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </div>

      {/* Page Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default ImportOpsLayout;
