import React, { useState } from 'react';
import { Compass, Users, ChevronDown } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../utils/authToken';

// AE Quick Switch users — hanya tampil saat user sedang di AE dept
const AE_QUICK_SWITCH = [
  { id: 101, employee_id: 'AE-001', name: 'Monica', nama: 'Monica', label: 'Monica (AE-001)', color: '#2563eb', departemen: 'Administrasi Export', level_otoritas: 'Staff Dept' },
  { id: 107, employee_id: 'AE-002', name: 'Wenny', nama: 'Wenny', label: 'Wenny (AE-002)', color: '#d97706', departemen: 'Administrasi Export', level_otoritas: 'Staff Dept' },
  { id: 108, employee_id: 'AE-003', name: 'Ama', nama: 'Ama', label: 'Ama (AE-003)', color: '#16a34a', departemen: 'Administrasi Export', level_otoritas: 'Staff Dept' },
  { id: 102, employee_id: 'SPV-AE-001', name: 'Amal', nama: 'Amal', label: 'Amal (SPV)', color: '#7c3aed', departemen: 'Administrasi Export', level_otoritas: 'Supervisor' },
];

const DevUserSwitcher = ({ currentUser }) => {
  const [open, setOpen] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const switchTo = async (u) => {
    setOpen(false);
    // For speed: directly set user in store without API call
    const userObj = { ...u, tipe_karyawan: 'Karyawan Tetap', status_aktif: true };
    setToken(userObj);
    useAuthStore.setState({ user: userObj });
    navigate('/workspace/staff');
    setTimeout(() => window.location.reload(), 100);
  };

  const currentLabel = AE_QUICK_SWITCH.find(u => u.id === currentUser?.id)?.label || 'Switch User';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
          backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px', padding: '4px 10px', color: 'rgba(255,255,255,0.9)',
          fontSize: '11px', fontWeight: '600'
        }}
      >
        <Users size={12} /> {currentLabel} <ChevronDown size={10} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '32px', right: 0, backgroundColor: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
            padding: '6px', zIndex: 100, minWidth: '180px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', padding: '4px 8px 6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              DEV QUICK SWITCH
            </div>
            {AE_QUICK_SWITCH.map(u => (
              <button
                key={u.id}
                onClick={() => switchTo(u)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                  padding: '7px 10px', background: currentUser?.id === u.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left',
                  color: currentUser?.id === u.id ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: u.color, flexShrink: 0 }} />
                {u.label}
                {u.level_otoritas === 'Supervisor' && <span style={{ fontSize: '9px', color: u.color, fontWeight: 700 }}>SPV</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TopNav = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAeDept = user?.departemen === 'Administrasi Export';

  const handleLogout = () => {
    logout();
    window.location.hash = '#/login';
    window.location.reload();
  };

  return (
    <div style={{
      height: '44px',
      backgroundColor: 'var(--color-surface-black)',
      color: 'var(--color-on-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--spacing-lg)',
      fontSize: '12px',
      fontWeight: '400',
      letterSpacing: '-0.12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Compass size={16} />
        <span style={{ cursor: 'pointer', fontWeight: '600' }}>Kompas EXIM</span>
      </div>
      
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Dev Quick Switch — hanya untuk AE dept */}
          {isAeDept && <DevUserSwitcher currentUser={user} />}
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>{user.name || user.nama}</span>
          <button onClick={handleLogout} style={{ color: 'var(--color-on-dark)', fontSize: '12px' }}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default TopNav;

