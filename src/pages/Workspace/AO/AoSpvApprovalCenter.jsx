import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Clock } from 'lucide-react';
import { api } from '../../../lib/api';
import Badge from '../../../components/Badge';

const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

const AoSpvApprovalCenter = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api('/ao-module/facility-monitoring');
      setData(res.pendingApprovals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve pencairan kasbon ini?')) return;
    try {
      await api(`/ao-module/kasbon/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ catatan_approval: 'Approved by SPV' })
      });
      fetchPending();
    } catch (err) {
      alert(err.message || 'Gagal approve');
    }
  };

  const handleReject = async (id) => {
    const alasan = window.prompt('Alasan penolakan:');
    if (!alasan) return;
    try {
      await api(`/ao-module/kasbon/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ catatan_approval: alasan })
      });
      fetchPending();
    } catch (err) {
      alert(err.message || 'Gagal menolak');
    }
  };

  const filteredData = data.filter(item => 
    item.kasbon_number?.toLowerCase().includes(search.toLowerCase()) || 
    item.pib_request_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--spacing-8)' }}>
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px', marginBottom: 'var(--spacing-1)' }}>Approval Center (SPV AO)</h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-muted-48)' }}>Persetujuan pencairan Kasbon dan Fasilitas di atas threshold</p>
      </div>

      <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-hairline)', display: 'flex', gap: 'var(--spacing-4)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} color="var(--color-ink-muted-48)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari Kasbon atau PIB..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 36px',
                border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-pill)',
                fontSize: 'var(--text-sm)'
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Loading...</div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
            <CheckCircle size={48} color="var(--color-status-success)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div>Tidak ada approval pending saat ini. Good job!</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-pearl)', textAlign: 'left', color: 'var(--color-ink-muted-80)' }}>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>No Kasbon & Sumber</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Project</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Jumlah Kasbon</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Pengaju</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                  <td style={{ padding: '12px 20px', fontWeight: '500' }}>
                    {item.kasbon_number}<br/>
                    {item.sumber === 'pib_request' ? (
                      <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>PIB: {item.pib_request_number}</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>Manual</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 20px' }}>{item.task_unique_number || '-'}</td>
                  <td style={{ padding: '12px 20px', fontWeight: '600' }}>
                    {formatRupiah(item.jumlah_diminta)}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontWeight: '500' }}>{item.diajukan_oleh_nama || '-'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleReject(item.id)}
                        style={{
                          background: 'none', border: '1px solid var(--color-status-danger)', color: 'var(--color-status-danger)',
                          padding: '6px 12px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', cursor: 'pointer', fontWeight: '500'
                        }}>
                        Tolak
                      </button>
                      <button 
                        onClick={() => handleApprove(item.id)}
                        style={{
                          background: 'var(--color-status-success)', border: '1px solid var(--color-status-success)', color: 'white',
                          padding: '6px 12px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', cursor: 'pointer', fontWeight: '500'
                        }}>
                        Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AoSpvApprovalCenter;
