import React from 'react';

const Badge = ({ type, value }) => {
  let bgColor = 'var(--color-surface-chip-translucent)';
  let color = 'var(--color-ink)';
  
  if (type === 'priority') {
    if (value === 'Rendah') {
      bgColor = 'var(--color-status-neutral-bg)';
      color = 'var(--color-status-neutral)';
    } else if (value === 'Sedang') {
      bgColor = 'var(--color-status-info-bg)';
      color = 'var(--color-status-info)';
    } else if (value === 'Tinggi') {
      bgColor = 'var(--color-status-warning-bg)';
      color = 'var(--color-status-warning)';
    } else if (value === 'Kritis') {
      bgColor = 'var(--color-status-danger-bg)';
      color = 'var(--color-status-danger)';
    }
  } else if (type === 'department') {
    if (value === 'Import') {
      bgColor = 'var(--color-status-info-bg)';
      color = 'var(--color-status-info)';
    } else if (value === 'Export' || value === 'Ekspor') {
      bgColor = 'var(--color-status-success-bg)';
      color = 'var(--color-status-success)';
    } else if (value === 'Administrasi Export (AE)') {
      bgColor = 'var(--color-status-warning-bg)';
      color = 'var(--color-status-warning)';
    } else if (value === 'Account Officer') {
      bgColor = 'var(--color-status-neutral-bg)';
      color = 'var(--color-status-neutral)';
    }
  } else if (type === 'sumber_tugas') {
    if (value === 'Manual') {
      bgColor = 'var(--color-status-success-bg)';
      color = 'var(--color-status-success)';
    } else if (value === 'System') {
      bgColor = 'var(--color-status-warning-bg)';
      color = 'var(--color-status-warning)';
    } else if (value === 'Escalation') {
      bgColor = 'var(--color-status-danger-bg)';
      color = 'var(--color-status-danger)';
    }
  } else if (type === 'docstatus') {
    if (value === 'Tervalidasi' || value === 'Aktif' || value === 'Terealisasi') {
      bgColor = 'var(--color-status-success-bg)';
      color = 'var(--color-status-success)';
    } else if (value === 'Menunggu Validasi' || value === 'Pending Verifikasi') {
      bgColor = 'var(--color-status-warning-bg)';
      color = 'var(--color-status-warning)';
    } else if (value === 'Kadaluarsa') {
      bgColor = 'var(--color-status-danger-bg)';
      color = 'var(--color-status-danger)';
    }
  } else if (type === 'paymentstatus') {
    if (value === 'Lunas') {
      bgColor = 'var(--color-status-success-bg)';
      color = 'var(--color-status-success)';
    } else if (value === 'Parsial') {
      bgColor = 'var(--color-status-warning-bg)';
      color = 'var(--color-status-warning)';
    } else if (value === 'Belum Dibayar') {
      bgColor = 'var(--color-status-danger-bg)';
      color = 'var(--color-status-danger)';
    }
  } else if (type === 'doctype') {
    bgColor = 'var(--color-canvas-parchment)';
    color = 'var(--color-ink-muted-80)';
  }

  const style = {
    backgroundColor: bgColor,
    color: color,
    padding: '4px 10px',
    borderRadius: 'var(--rounded-pill)',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };

  return <span style={style}>{value}</span>;
};

export default Badge;
