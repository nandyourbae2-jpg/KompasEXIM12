import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import Button from '../components/Button';
import { Compass } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  
  const [tipeAkses, setTipeAkses] = useState('Staff Departemen');
  const [departemen, setDepartemen] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!employeeId || !password) {
      setError('Employee ID dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await login(employeeId, password, {});
      navigate('/workspace');
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa data Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 'var(--rounded-sm)',
    border: '1px solid var(--color-hairline)',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: 'var(--color-canvas)',
    color: 'var(--color-ink)',
    fontFamily: 'var(--font-family-body)',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-ink)',
    marginBottom: '8px',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-canvas-parchment)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-family-body)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <Compass size={32} color="var(--color-primary)" />
        <h1 style={{
          fontSize: '28px',
          fontWeight: '600',
          letterSpacing: '-0.374px',
          color: 'var(--color-ink)',
          margin: 0,
        }}>
          Kompas <span style={{ color: 'var(--color-primary)' }}>EXIM</span>
        </h1>
      </div>

      {/* Card */}
      <div style={{
        backgroundColor: 'var(--color-canvas)',
        padding: '40px',
        borderRadius: 'var(--rounded-lg)',
        border: '1px solid var(--color-hairline)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        width: '100%',
        maxWidth: '420px',
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          letterSpacing: '-0.374px',
          color: 'var(--color-ink)',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          Masuk ke Workspace
        </h2>

        {/* Error Banner */}
        {error && (
          <div style={{
            backgroundColor: 'var(--color-status-danger-bg)',
            border: '1px solid var(--color-status-danger)',
            color: 'var(--color-status-danger)',
            padding: '10px 14px',
            borderRadius: 'var(--rounded-sm)',
            marginBottom: '16px',
            fontSize: '13px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Removed Tipe Akses & Departemen options to simplify login by ID */}

          {/* Employee ID */}
          <div>
            <label style={labelStyle}>
              Employee ID <span style={{ color: 'var(--color-status-danger)' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="cth: EXIM-IMP-04"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>
              Password <span style={{ color: 'var(--color-status-danger)' }}>*</span>
            </label>
            <input
              type="password"
              placeholder="Masukkan password Anda (123456)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-ink-muted-80)', cursor: 'pointer' }}>
              <input type="checkbox" style={{ margin: 0 }} />
              Ingat saya
            </label>
            <a href="#" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none' }}>
              Lupa password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 'var(--rounded-pill)',
              border: 'none',
              backgroundColor: isLoading ? 'var(--color-ink-muted-48)' : 'var(--color-primary)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-family-body)',
              transition: 'background-color 0.15s',
              marginTop: '4px',
            }}
          >
            {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>
      </div>

      {/* Footer hint */}
      <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--color-ink-muted-48)', textAlign: 'center' }}>
        Platform Manajemen Ekspor–Impor · PT Pahala Bahari Nusantara
      </p>
    </div>
  );
};

export default LoginPage;
