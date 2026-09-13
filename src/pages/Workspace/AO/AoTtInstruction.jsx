import React, { useState, useEffect } from 'react';
import { Send, Plus, Search, CheckSquare } from 'lucide-react';
import { api } from '../../../lib/api';
import Badge from '../../../components/Badge';

const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

const AoTtInstruction = () => {
  const [data, setData] = useState([]);
  const [pendingJo, setPendingJo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'list') {
        const res = await api('/ao-module/tt');
        setData(res);
      } else {
        const res = await api('/ao-module/tt/pending-jo');
        setPendingJo(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const executeTT = async (id) => {
    if (!window.confirm('Eksekusi T/T? Ini akan memotong sisa tagihan Job Order secara permanen.')) return;
    try {
      await api(`/ao-module/tt/${id}/execute`, { method: 'PATCH' });
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal mengeksekusi T/T');
    }
  };

  const filteredData = data.filter(item => 
    item.tt_number?.toLowerCase().includes(search.toLowerCase()) || 
    item.job_order_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--spacing-8)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-8)' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px', marginBottom: 'var(--spacing-1)' }}>Instruksi Pembayaran (T/T)</h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-muted-48)' }}>Kelola dan eksekusi Telegraphic Transfer untuk Job Order</p>
        </div>
        <button style={{
          backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none',
          padding: '8px 16px', borderRadius: 'var(--rounded-pill)', fontSize: 'var(--text-sm)', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
        }}>
          <Plus size={16} /> Buat T/T Baru
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--color-hairline)' }}>
        <button 
          onClick={() => setActiveTab('list')}
          style={{ 
            background: 'none', border: 'none', padding: '12px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
            borderBottom: activeTab === 'list' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'list' ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'
          }}>
          Daftar Instruksi T/T
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ 
            background: 'none', border: 'none', padding: '12px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
            borderBottom: activeTab === 'pending' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'pending' ? 'var(--color-primary)' : 'var(--color-ink-muted-48)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
          JO Butuh Transfer
          {pendingJo.length > 0 && activeTab !== 'pending' && (
            <span style={{ backgroundColor: 'var(--color-status-danger)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>
              {pendingJo.length}
            </span>
          )}
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
        {activeTab === 'list' && (
          <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-hairline)', display: 'flex', gap: 'var(--spacing-4)' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={16} color="var(--color-ink-muted-48)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Cari T/T atau Job Order..." 
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
        )}

        {loading ? (
          <div style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Loading...</div>
        ) : activeTab === 'list' ? (
          filteredData.length === 0 ? (
            <div style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Tidak ada data instruksi T/T.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-pearl)', textAlign: 'left', color: 'var(--color-ink-muted-80)' }}>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>No T/T</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Job Order</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Penerima & Bank</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Nominal</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Status</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: '500' }}>
                      {item.tt_number}<br/>
                      <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 'normal' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ fontWeight: '500' }}>{item.job_order_code || '-'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>{item.cost_type || '-'}</div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ fontWeight: '500' }}>{item.nama_penerima || '-'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>{item.nomor_rekening_tujuan || '-'} • Bank: {item.bank_pengirim}</div>
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: '600' }}>
                      {item.mata_uang === 'IDR' ? formatRupiah(item.nominal) : item.mata_uang + ' ' + item.nominal.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <Badge variant={item.status === 'Terkirim' ? 'success' : item.status === 'Gagal' ? 'danger' : 'warning'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      {item.status !== 'Terkirim' && (
                        <button 
                          onClick={() => executeTT(item.id)}
                          style={{
                            background: 'none', border: '1px solid var(--color-status-success)', color: 'var(--color-status-success)',
                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}>
                          <CheckSquare size={14} /> Eksekusi
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          pendingJo.length === 0 ? (
            <div style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Tidak ada Job Order yang butuh transfer.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-pearl)', textAlign: 'left', color: 'var(--color-ink-muted-80)' }}>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Job Order</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Vendor</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Sisa Tagihan</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingJo.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: '500' }}>
                      {item.job_order_code}<br/>
                      <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 'normal' }}>{item.cost_type}</span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>{item.vendor_nama || '-'}</td>
                    <td style={{ padding: '12px 20px', fontWeight: '600' }}>
                      {item.mata_uang === 'USD' ? '$ ' + (item.total_invoice - item.total_paid).toLocaleString('en-US') : formatRupiah(item.total_invoice - item.total_paid)}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <button style={{
                        background: 'none', border: '1px solid var(--color-primary)', color: 'var(--color-primary)',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Send size={14} /> Buat T/T
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
};

export default AoTtInstruction;
