import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, FileText, Shield } from 'lucide-react';
import { api } from '../../../lib/api';
import Badge from '../../../components/Badge';

const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

const AoSpvFacilityMonitoring = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api('/ao-module/facility-monitoring');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 'var(--spacing-8)', color: 'var(--color-ink-muted-48)' }}>Loading Monitoring Data...</div>;
  if (!data) return <div style={{ padding: 'var(--spacing-8)', color: 'var(--color-status-danger)' }}>Gagal memuat data.</div>;

  const persenGlobal = data.totalLimit > 0 ? ((data.totalUtilisasi / data.totalLimit) * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: 'var(--spacing-8)' }}>
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px', marginBottom: 'var(--spacing-1)' }}>Facility Monitoring</h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-muted-48)' }}>Kontrol Utilisasi Fasilitas Kredit dan Peringatan Dini LC/BG</p>
      </div>

      <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Total Utilisasi Global</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Total Limit</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>{formatRupiah(data.totalLimit)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Total Utilisasi</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: persenGlobal > 80 ? 'var(--color-status-danger)' : 'var(--color-primary)' }}>
              {formatRupiah(data.totalUtilisasi)} ({persenGlobal}%)
            </div>
          </div>
        </div>
        <div style={{ width: '100%', backgroundColor: 'var(--color-hairline)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${Math.min(persenGlobal, 100)}%`, 
            backgroundColor: persenGlobal > 80 ? 'var(--color-status-danger)' : persenGlobal > 60 ? 'var(--color-status-warning)' : 'var(--color-primary)', 
            height: '100%' 
          }}></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        {data.fasilitas && data.fasilitas.map(f => (
          <div key={f.id} style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)', fontWeight: '600' }}>{f.nama_fasilitas}</div>
              <Activity size={16} color="var(--color-ink-muted-48)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
              <span style={{ color: 'var(--color-ink-muted-48)' }}>Utilisasi</span>
              <span style={{ fontWeight: '600' }}>{formatRupiah(f.utilisasi)} / {formatRupiah(f.limit_fasilitas)}</span>
            </div>
            <div style={{ width: '100%', backgroundColor: 'var(--color-hairline)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(f.persen_terpakai, 100)}%`, 
                backgroundColor: f.persen_terpakai > 80 ? 'var(--color-status-danger)' : 'var(--color-primary)', 
                height: '100%' 
              }}></div>
            </div>
            {f.persen_terpakai > 80 && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-status-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> Limit hampir habis
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-6)' }}>
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
          <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-hairline)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--color-status-warning)" />
            <h2 style={{ fontSize: '14px', fontWeight: '600' }}>LC Expiring &lt;30 Hari</h2>
          </div>
          <div style={{ padding: '0' }}>
            {data.lcExpiring && data.lcExpiring.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  {data.lcExpiring.map(lc => (
                    <tr key={lc.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{lc.lc_number}</td>
                      <td style={{ padding: '12px', color: 'var(--color-status-danger)' }}>{lc.tanggal_expired}</td>
                      <td style={{ padding: '12px' }}>{lc.bank_penerbit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-ink-muted-48)', fontSize: '12px' }}>Tidak ada LC yang segera expired.</div>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
          <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-hairline)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="var(--color-status-warning)" />
            <h2 style={{ fontSize: '14px', fontWeight: '600' }}>BG Expiring &lt;30 Hari</h2>
          </div>
          <div style={{ padding: '0' }}>
            {data.bgExpiring && data.bgExpiring.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  {data.bgExpiring.map(bg => (
                    <tr key={bg.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{bg.bg_number}</td>
                      <td style={{ padding: '12px', color: 'var(--color-status-danger)' }}>{bg.tanggal_expired}</td>
                      <td style={{ padding: '12px' }}>{bg.penerima_bg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-ink-muted-48)', fontSize: '12px' }}>Tidak ada BG yang segera expired.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AoSpvFacilityMonitoring;
