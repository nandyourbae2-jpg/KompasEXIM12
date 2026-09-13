import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileCheck, Shield, CheckCircle2, XCircle, 
  AlertTriangle, Upload, ChevronLeft, Search
} from 'lucide-react';
import api from '../../../lib/api';

const AeDocumentControlHub = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (taskId) fetchDocuments();
  }, [taskId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ae/tasks/${taskId}/documents`);
      setDocuments(res.data.data.checklists || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (docId, status) => {
    try {
      const notes = prompt(`Tambahkan catatan untuk status ${status}:`);
      await api.post(`/ae/documents/${docId}/verify`, { status, notes });
      fetchDocuments();
    } catch (err) {
      alert('Gagal memverifikasi dokumen.');
    }
  };

  if (!taskId) {
    return (
      <div style={styles.emptyState}>
        Silakan pilih tugas ekspor dari My Tasks terlebih dahulu untuk melihat kelengkapan dokumen.
      </div>
    );
  }

  if (loading) return <div style={styles.loading}>Memuat dokumen...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={styles.title}>Document Verification</h1>
            <p style={styles.subtitle}>Task ID: {taskId}</p>
          </div>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>Verified</span>
          <span style={styles.statValue}>
            {documents.filter(d => d.verification_status === 'Verified').length} / {documents.length}
          </span>
        </div>
      </header>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Daftar Dokumen Ekspor</h2>
          <button style={styles.uploadBtn}>
            <Upload size={16} /> Upload Dokumen
          </button>
        </div>
        
        {documents.length === 0 ? (
          <div style={styles.emptyTable}>Belum ada checklist dokumen untuk tugas ini.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nama Dokumen</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Diverifikasi Oleh</th>
                <th style={styles.th}>Tanggal</th>
                <th style={styles.th}>Catatan</th>
                <th style={styles.th}>Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.docName}>
                      <FileCheck size={18} color="#0066cc" />
                      {doc.doc_type}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{...styles.badge, ...styles.statusBadge(doc.verification_status)}}>
                      {doc.verification_status}
                    </span>
                  </td>
                  <td style={styles.td}>{doc.verified_by_name || '-'}</td>
                  <td style={styles.td}>{doc.verified_at ? new Date(doc.verified_at).toLocaleDateString('id-ID') : '-'}</td>
                  <td style={styles.td}>{doc.notes || '-'}</td>
                  <td style={styles.td}>
                    <div style={styles.actionGroup}>
                      <button style={styles.iconBtn('Verified')} onClick={() => handleVerify(doc.id, 'Verified')} title="Verify">
                        <CheckCircle2 size={18} />
                      </button>
                      <button style={styles.iconBtn('Revision Required')} onClick={() => handleVerify(doc.id, 'Revision Required')} title="Request Revision">
                        <AlertTriangle size={18} />
                      </button>
                      <button style={styles.iconBtn('Rejected')} onClick={() => handleVerify(doc.id, 'Rejected')} title="Reject">
                        <XCircle size={18} />
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

const styles = {
  container: { padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { background: '#f5f5f7', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: '28px', fontWeight: '700', margin: '0 0 4px 0' },
  subtitle: { fontSize: '15px', color: '#86868b', margin: 0 },
  statBox: { background: '#f5f5f7', padding: '12px 20px', borderRadius: '12px', textAlign: 'center' },
  statLabel: { fontSize: '12px', color: '#86868b', fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: '24px', fontWeight: '700', color: '#137333' },
  card: { background: '#fff', border: '1px solid #e5e5ea', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e5ea' },
  cardTitle: { margin: 0, fontSize: '18px', fontWeight: '600' },
  uploadBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: '#0066cc', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#86868b', borderBottom: '1px solid #e5e5ea', background: '#fafafa' },
  tr: { borderBottom: '1px solid #f5f5f7' },
  td: { padding: '16px 24px', fontSize: '14px', verticalAlign: 'middle' },
  docName: { display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  statusBadge: (status) => {
    switch (status) {
      case 'Verified': return { background: '#e3f5eb', color: '#137333' };
      case 'Pending': return { background: '#f5f5f7', color: '#86868b' };
      case 'Revision Required': return { background: '#fdf0d5', color: '#945c05' };
      case 'Rejected': return { background: '#fce8e6', color: '#c5221f' };
      case 'Missing': return { background: '#fce8e6', color: '#c5221f' };
      default: return { background: '#f5f5f7', color: '#86868b' };
    }
  },
  actionGroup: { display: 'flex', gap: '8px' },
  iconBtn: (type) => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    color: type === 'Verified' ? '#137333' : type === 'Revision Required' ? '#945c05' : '#c5221f'
  }),
  loading: { padding: '40px', textAlign: 'center' },
  emptyState: { padding: '100px 20px', textAlign: 'center', background: '#f5f5f7', color: '#86868b', borderRadius: '16px' },
  emptyTable: { padding: '60px', textAlign: 'center', color: '#86868b' }
};

export default AeDocumentControlHub;
