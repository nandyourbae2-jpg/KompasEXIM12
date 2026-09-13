import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, ShieldCheck, DollarSign, Database, Users } from 'lucide-react';
import { api } from '../../lib/api';

const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

const ManagerAoOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api('/ao-module/manager-report');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 'var(--spacing-8)', color: 'var(--color-ink-muted-48)' }}>Loading Department Report...</div>;
  if (!data) return <div style={{ padding: 'var(--spacing-8)', color: 'var(--color-status-danger)' }}>Gagal memuat laporan departemen.</div>;

  const { kpi, risk, aoStaff } = data;

  return (
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px', marginBottom: 'var(--spacing-1)' }}>Account Officer Overview</h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-muted-48)' }}>Laporan Departemen & Kontrol Fasilitas</p>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 'var(--spacing-4)' }}>Key Performance Indicators</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-5)', marginBottom: 'var(--spacing-8)' }}>
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>Utilisasi Fasilitas</div>
            <Database size={20} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-ink)' }}>{kpi.utilisasiPersen}%</div>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '4px' }}>
            Dari total {formatRupiah(kpi.totalLimit)}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>Kasbon Outstanding</div>
            <DollarSign size={20} color="var(--color-badge-high)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-ink)' }}>{formatRupiah(kpi.kasbonOutstanding)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>Trade Finance Aktif</div>
            <ShieldCheck size={20} color="var(--color-status-success)" />
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>{kpi.lcActive}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>LC Aktif</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>{kpi.bgActive}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>BG Aktif</div>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 'var(--spacing-4)' }}>Risk Watchlist</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-5)', marginBottom: 'var(--spacing-8)' }}>
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-5)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: risk.fasilitasOverLimit > 0 ? 'var(--color-status-danger-bg)' : 'var(--color-status-success-bg)', padding: '12px', borderRadius: '50%' }}>
            <AlertTriangle size={24} color={risk.fasilitasOverLimit > 0 ? 'var(--color-status-danger)' : 'var(--color-status-success)'} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>{risk.fasilitasOverLimit} Fasilitas</div>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Utilisasi &gt; 80%</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-5)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: risk.lcExpiring > 0 || risk.bgExpiring > 0 ? 'var(--color-status-warning-bg)' : 'var(--color-status-success-bg)', padding: '12px', borderRadius: '50%' }}>
            <Activity size={24} color={risk.lcExpiring > 0 || risk.bgExpiring > 0 ? 'var(--color-status-warning)' : 'var(--color-status-success)'} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>{risk.lcExpiring + risk.bgExpiring} Dokumen</div>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>LC/BG Expired &lt; 30 Hari</div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 'var(--spacing-4)' }}>Tim Account Officer</h2>
      <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-pearl)', textAlign: 'left', color: 'var(--color-ink-muted-80)' }}>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Nama Staff</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>ID Pegawai</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Level Otoritas</th>
            </tr>
          </thead>
          <tbody>
            {aoStaff.map(staff => (
              <tr key={staff.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                <td style={{ padding: '12px 20px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="var(--color-ink-muted-48)" />
                  {staff.nama}
                </td>
                <td style={{ padding: '12px 20px' }}>{staff.employee_id}</td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500',
                    backgroundColor: staff.level_otoritas === 'Supervisor' ? 'var(--color-status-info-bg)' : 'var(--color-surface-pearl)',
                    color: staff.level_otoritas === 'Supervisor' ? 'var(--color-primary)' : 'var(--color-ink-muted-80)'
                  }}>
                    {staff.level_otoritas}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerAoOverview;
