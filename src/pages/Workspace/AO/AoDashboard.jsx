import React, { useState, useEffect } from 'react';
import { FileText, Shield, CheckSquare, Activity, AlertTriangle, CheckCircle, Package, Clock, ShieldAlert } from 'lucide-react';
import { api } from '../../../lib/api';

const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

const AoDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api('/ao-module/dashboard')
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 'var(--spacing-8)', color: 'var(--color-ink-muted-48)' }}>Loading Dashboard...</div>;
  if (!data) return <div style={{ padding: 'var(--spacing-8)', color: 'var(--color-status-danger)' }}>Gagal memuat data dashboard.</div>;

  return (
    <div style={{ padding: 'var(--spacing-8)' }}>
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px', marginBottom: 'var(--spacing-1)' }}>Dashboard AO</h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-muted-48)' }}>Ringkasan Portofolio Fasilitas & Pembayaran EXIM</p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)'
      }}>
        {/* Card 1: LC Aktif */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>LC Aktif</div>
            <FileText size={20} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: '600', color: 'var(--color-ink)', marginBottom: 'var(--spacing-1)' }}>
            {data.lcActive || 0}
          </div>
          {data.lcExpiring > 0 && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-status-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={14} /> {data.lcExpiring} akan expired &lt;30 hari
            </div>
          )}
        </div>

        {/* Card 2: BG Aktif */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>Bank Guarantee</div>
            <Shield size={20} color="var(--color-badge-medium)" />
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: '600', color: 'var(--color-ink)', marginBottom: 'var(--spacing-1)' }}>
            {data.bgActive || 0}
          </div>
          {data.bgExpiring > 0 && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-status-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={14} /> {data.bgExpiring} akan expired &lt;30 hari
            </div>
          )}
        </div>

        {/* Card 3: Kasbon Outstanding */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>Kasbon Outstanding</div>
            <Activity size={20} color="var(--color-badge-high)" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: 'var(--spacing-1)' }}>
            {formatRupiah(data.kasbonOutstanding || 0)}
          </div>
          {data.kasbonPending > 0 && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /> {data.kasbonPending} Menunggu Approval
            </div>
          )}
        </div>

        {/* Card 4: T/T Pending */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>T/T Belum Dieksekusi</div>
            <CheckSquare size={20} color={data.ttPending > 0 ? "var(--color-status-danger)" : "var(--color-status-success)"} />
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: '600', color: 'var(--color-ink)', marginBottom: 'var(--spacing-1)' }}>
            {data.ttPending || 0}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted-48)' }}>
            Perlu proses eksekusi transfer
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
        <div style={{ padding: 'var(--spacing-5)', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Kasbon Request Terbaru (Dari PIB)</h2>
        </div>
        <div style={{ padding: '0' }}>
          {data.recentKasbon && data.recentKasbon.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-pearl)', textAlign: 'left', color: 'var(--color-ink-muted-80)' }}>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>No Kasbon</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Sumber PIB</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Project</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Jumlah</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentKasbon.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: '500' }}>{item.kasbon_number}</td>
                    <td style={{ padding: '12px 20px' }}>{item.pib_request_number || '-'}</td>
                    <td style={{ padding: '12px 20px' }}>{item.task_unique_number || '-'}</td>
                    <td style={{ padding: '12px 20px', fontWeight: '600' }}>{formatRupiah(item.jumlah_diminta)}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: 'var(--rounded-full)', fontSize: '11px', fontWeight: '600',
                        backgroundColor: item.status === 'Dicairkan' ? 'var(--color-status-success-bg)' : item.status === 'Diajukan' ? 'var(--color-status-warning-bg)' : 'var(--color-status-neutral-bg)',
                        color: item.status === 'Dicairkan' ? 'var(--color-status-success)' : item.status === 'Diajukan' ? 'var(--color-status-warning)' : 'var(--color-status-neutral)'
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
              Belum ada permintaan kasbon terbaru.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AoDashboard;
