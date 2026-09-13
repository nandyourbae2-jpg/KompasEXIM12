import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../../../lib/api';
import Badge from '../../../components/Badge';

const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const AoLcManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLCs();
  }, []);

  const fetchLCs = () => {
    setLoading(true);
    api('/ao-module/lc')
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredData = data.filter(item => 
    item.lc_number?.toLowerCase().includes(search.toLowerCase()) || 
    item.bank_penerbit?.toLowerCase().includes(search.toLowerCase()) ||
    item.beneficiary?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--spacing-8)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-8)' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px', marginBottom: 'var(--spacing-1)' }}>LC Management</h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-muted-48)' }}>Kelola Letter of Credit (Sight, Usance, Standby)</p>
        </div>
        <button style={{
          backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none',
          padding: '8px 16px', borderRadius: 'var(--rounded-pill)', fontSize: 'var(--text-sm)', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
        }}>
          <Plus size={16} /> Buat LC Baru
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-hairline)', display: 'flex', gap: 'var(--spacing-4)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} color="var(--color-ink-muted-48)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari LC, bank, atau beneficiary..." 
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
          <div style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Tidak ada data LC.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-pearl)', textAlign: 'left', color: 'var(--color-ink-muted-80)' }}>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>No LC Sistem</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Bank & Jenis</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Beneficiary</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Nilai LC</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Tgl Expired</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-hairline)', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 20px', fontWeight: '500' }}>
                    {item.lc_number}<br/>
                    <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 'normal' }}>Project: {item.task_unique_number || '-'}</span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontWeight: '500' }}>{item.bank_penerbit}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>{item.jenis_lc}</div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>{item.beneficiary}</td>
                  <td style={{ padding: '12px 20px', fontWeight: '600' }}>
                    {item.mata_uang === 'USD' ? formatUSD(item.nilai_lc) : item.mata_uang + ' ' + item.nilai_lc.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <Badge variant={['Issued','Amended','Utilized'].includes(item.status) ? 'success' : item.status === 'Draft' ? 'neutral' : 'warning'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 20px', color: item.status === 'Expired' ? 'var(--color-status-danger)' : 'inherit' }}>
                    {item.tanggal_expired || '-'}
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

export default AoLcManagement;
