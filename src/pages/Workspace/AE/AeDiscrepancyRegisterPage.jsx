import React, { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';
import api from '../../../lib/api';

const AeDiscrepancyRegisterPage = () => {
  const [discrepancies, setDiscrepancies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscrepancies();
  }, []);

  const fetchDiscrepancies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ae/discrepancies');
      setDiscrepancies(res.data.data.discrepancies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.post(`/ae/discrepancies/${id}/resolve`);
      fetchDiscrepancies();
    } catch (err) {
      alert('Gagal resolve discrepancy.');
    }
  };

  if (loading) return <div style={styles.loading}>Memuat isu...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Register Discrepancy</h1>
          <p style={styles.subtitle}>Pencatatan dan penyelesaian isu/ketidaksesuaian operasional ekspor</p>
        </div>
      </header>

      <div style={styles.card}>
        {discrepancies.length === 0 ? (
          <div style={styles.emptyState}>
            <AlertOctagon size={48} color="#d2d2d7" style={{marginBottom: 16}} />
            <div style={{fontSize: '16px', fontWeight: '500', color: '#1d1d1f'}}>Tidak ada isu aktif</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Task/Export Ref</th>
                <th style={styles.th}>Kategori Isu</th>
                <th style={styles.th}>Severity</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Dilaporkan Oleh</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {discrepancies.map(d => (
                <tr key={d.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{fontWeight: '500'}}>{d.judul}</div>
                    <div style={{fontSize: '12px', color: '#86868b'}}>{d.reference_id || 'N/A'}</div>
                  </td>
                  <td style={styles.td}>{d.category}</td>
                  <td style={styles.td}>{d.severity}</td>
                  <td style={styles.td}>{d.status}</td>
                  <td style={styles.td}>{d.detected_by_name}</td>
                  <td style={styles.td}>
                    {d.status !== 'Resolved' && d.status !== 'Closed' && (
                      <button style={styles.resolveBtn} onClick={() => handleResolve(d.id)}>
                        <CheckCircle2 size={16} /> Resolve
                      </button>
                    )}
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

const styles = {
  container: { padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: '#86868b', margin: 0 },
  card: { background: '#fff', border: '1px solid #e5e5ea', borderRadius: '16px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#86868b', borderBottom: '1px solid #e5e5ea', background: '#fafafa' },
  tr: { borderBottom: '1px solid #f5f5f7' },
  td: { padding: '16px 24px', fontSize: '14px', verticalAlign: 'middle' },
  emptyState: { padding: '80px 20px', textAlign: 'center', color: '#86868b' },
  resolveBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#e3f5eb', color: '#137333', border: '1px solid #137333', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  loading: { padding: '40px', textAlign: 'center' }
};

export default AeDiscrepancyRegisterPage;
