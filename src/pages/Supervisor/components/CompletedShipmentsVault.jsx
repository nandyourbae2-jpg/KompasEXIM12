import React, { useState, useMemo } from 'react';
import { Search, FileText, CheckCircle } from 'lucide-react';
import { useAoStore } from '../../../store/useAoStore';

const CompletedShipmentsVault = () => {
  const { completedShipments } = useAoStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = completedShipments || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j => 
        (j.invoice_no || '').toLowerCase().includes(q) ||
        (j.buyer || '').toLowerCase().includes(q) ||
        (j.destination || '').toLowerCase().includes(q) ||
        (j.ao_assignee_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [completedShipments, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ position: 'relative', width: '300px' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Cari Invoice, Buyer, Destinasi..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Invoice No', 'Buyer', 'Destinasi', 'Tgl Selesai', 'AO Assignee', 'DSCS PIC', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <FileText size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <br />Tidak ada shipment selesai yang ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map(job => (
                <tr key={job.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>{job.invoice_no}</td>
                  <td style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>{job.buyer || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{job.destination || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>
                    {job.completed_at ? new Date(job.completed_at).toLocaleDateString('id-ID') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                      {job.ao_assignee_name || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {job.dscs_assignee_name ? (
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                        {job.dscs_assignee_name}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#15803d' }}>
                      <CheckCircle size={12} />
                      COMPLETED
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompletedShipmentsVault;
