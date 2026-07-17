import React from 'react';
import { Compass } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const TopNav = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span>{user.name}</span>
          <button onClick={handleLogout} style={{ color: 'var(--color-on-dark)', fontSize: '12px' }}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default TopNav;
