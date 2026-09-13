import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search } from 'lucide-react';
import { api } from '../../../lib/api';
import Badge from '../../../components/Badge';

const formatCurrency = (val, currency) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(val);

const AoFxBooking = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFXs();
  }, []);

  const fetchFXs = () => {
    setLoading(true);
    api('/ao-module/fx')
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredData = data.filter(item => 
    item.fx_number?.toLowerCase().includes(search.toLowerCase()) || 
    item.bank_pelaksana?.toLowerCase().includes(search.toLowerCase()) ||
    item.job_order_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--spacing-8)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-8)' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px', marginBottom: 'var(--spacing-1)' }}>FX Booking</h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-muted-48)' }}>Kelola booking valas untuk pembayaran Job Order</p>
        </div>
        <button style={{
          backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none',
          padding: '8px 16px', borderRadius: 'var(--rounded-pill)', fontSize: 'var(--text-sm)', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
        }}>
          <Plus size={16} /> Booking FX Baru
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-hairline)', display: 'flex', gap: 'var(--spacing-4)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} color="var(--color-ink-muted-48)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari FX, bank, atau Job Order..." 
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
          <div style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Tidak ada data FX Booking.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-pearl)', textAlign: 'left', color: 'var(--color-ink-muted-80)' }}>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>No FX & Tgl</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Job Order</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Kurs (IDR)</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Nominal Valas</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-hairline)', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 20px', fontWeight: '500' }}>
                    {item.fx_number}<br/>
                    <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 'normal' }}>{item.tanggal_booking} • {item.bank_pelaksana}</span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontWeight: '500' }}>{item.job_order_code || '-'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>{item.task_unique_number || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontWeight: '500' }}>Rp {item.kurs.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>Total: Rp {item.nominal_asal.toLocaleString()}</div>
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: '600' }}>
                    {formatCurrency(item.nominal_tujuan, item.mata_uang_tujuan)}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <Badge variant={item.status === 'Settled' ? 'success' : item.status === 'Booked' ? 'neutral' : 'warning'}>
                      {item.status}
                    </Badge>
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

export default AoFxBooking;
