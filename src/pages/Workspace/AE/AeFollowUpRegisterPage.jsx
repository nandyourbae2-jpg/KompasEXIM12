import React, { useState, useEffect } from 'react';
import { PhoneCall, Edit } from 'lucide-react';
import api from '../../../lib/api';

const AeFollowUpRegisterPage = () => {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ae/follow-ups');
      setFollowUps(res.data.data.followUps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    const response = prompt('Masukkan catatan respon / hasil kontak:');
    if (!response) return;
    try {
      await api.post(`/ae/follow-ups/${id}/status`, { status: 'Waiting Response', response });
      fetchFollowUps();
    } catch (err) {
      alert('Gagal update follow-up.');
    }
  };

  if (loading) return <div style={styles.loading}>Memuat data...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Register Follow-Up</h1>
          <p style={styles.subtitle}>Pemantauan status kontak, penagihan, dan koordinasi dengan pihak eksternal</p>
        </div>
      </header>

      <div style={styles.card}>
        {followUps.length === 0 ? (
          <div style={styles.emptyState}>
            <PhoneCall size={48} color="#d2d2d7" style={{marginBottom: 16}} />
            <div style={{fontSize: '16px', fontWeight: '500', color: '#1d1d1f'}}>Tidak ada Follow-Up aktif</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Task/Export Ref</th>
                <th style={styles.th}>Tipe Follow-Up</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Tenggat</th>
                <th style={styles.th}>Catatan Terakhir</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map(f => (
                <tr key={f.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{fontWeight: '500'}}>{f.judul}</div>
                    <div style={{fontSize: '12px', color: '#86868b'}}>{f.reference_id || 'N/A'}</div>
                  </td>
                  <td style={styles.td}>{f.followup_type}</td>
                  <td style={styles.td}>{f.status}</td>
                  <td style={styles.td}>{f.due_date ? new Date(f.due_date).toLocaleDateString('id-ID') : '-'}</td>
                  <td style={styles.td}>{f.notes || '-'}</td>
                  <td style={styles.td}>
                    <button style={styles.updateBtn} onClick={() => handleUpdate(f.id)}>
                      <Edit size={16} /> Update Progress
                    </button>
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
  updateBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f5f5f7', color: '#1d1d1f', border: '1px solid #d2d2d7', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  loading: { padding: '40px', textAlign: 'center' }
};

export default AeFollowUpRegisterPage;
