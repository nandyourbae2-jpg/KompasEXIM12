import React, { useState, useEffect } from 'react';
import { Activity, Plus, Search, CheckCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import Badge from '../../../components/Badge';

const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

const AoKasbonFasilitas = () => {
  const [kasbonData, setKasbonData] = useState([]);
  const [fasilitasData, setFasilitasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kasbonRes, fasilitasRes] = await Promise.all([
        api('/ao-module/kasbon'),
        api('/ao-module/fasilitas')
      ]);
      setKasbonData(kasbonRes);
      setFasilitasData(fasilitasRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredKasbon = kasbonData.filter(item => 
    item.kasbon_number?.toLowerCase().includes(search.toLowerCase()) || 
    item.pib_request_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--spacing-8)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-8)' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px', marginBottom: 'var(--spacing-1)' }}>Kasbon & Fasilitas Kredit</h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-muted-48)' }}>Kelola pencairan Kasbon dan utilisasi Fasilitas Kredit</p>
        </div>
        <button style={{
          backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none',
          padding: '8px 16px', borderRadius: 'var(--rounded-pill)', fontSize: 'var(--text-sm)', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
        }}>
          <Plus size={16} /> Kasbon Manual
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        {fasilitasData.map(f => (
          <div key={f.id} style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>{f.nama_fasilitas}</div>
              <Activity size={20} color="var(--color-badge-medium)" />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>Limit: {formatRupiah(f.limit_fasilitas)}</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-ink)' }}>Sisa: {formatRupiah(f.sisa)}</div>
            </div>
            <div style={{ width: '100%', backgroundColor: 'var(--color-hairline)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(f.persen_terpakai, 100)}%`, 
                backgroundColor: f.persen_terpakai > 80 ? 'var(--color-status-danger)' : 'var(--color-primary)', 
                height: '100%' 
              }}></div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '4px', textAlign: 'right' }}>
              {f.persen_terpakai}% Terpakai
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-hairline)', display: 'flex', gap: 'var(--spacing-4)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} color="var(--color-ink-muted-48)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari No Kasbon atau PIB..." 
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
        ) : filteredKasbon.length === 0 ? (
          <div style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Tidak ada data Kasbon.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-pearl)', textAlign: 'left', color: 'var(--color-ink-muted-80)' }}>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>No Kasbon & Sumber</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Project & Fasilitas</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Jumlah</th>
                <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '500' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredKasbon.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-hairline)', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 20px', fontWeight: '500' }}>
                    {item.kasbon_number}<br/>
                    {item.sumber === 'pib_request' ? (
                      <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>PIB: {item.pib_request_number}</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: 'normal' }}>Manual</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontWeight: '500' }}>{item.task_unique_number || '-'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>{item.nama_fasilitas || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: '600' }}>
                    {formatRupiah(item.jumlah_diminta)}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <Badge variant={item.status === 'Dicairkan' ? 'success' : item.status === 'Diajukan' ? 'warning' : 'neutral'}>
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

export default AoKasbonFasilitas;
