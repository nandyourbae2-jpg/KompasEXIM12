import React, { useState } from 'react';
import { AlertCircle, ArrowRight, FileX } from 'lucide-react';

const AeMissingDocumentsDashboard = () => {
  // Placeholder data for Sprint 3
  const [missingDocs] = useState([]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Dokumen Belum Lengkap</h1>
          <p style={styles.subtitle}>Pemantauan dokumen ekspor yang masih berstatus Missing atau Revision Required</p>
        </div>
      </header>

      <div style={styles.card}>
        {missingDocs.length === 0 ? (
          <div style={styles.emptyState}>
            <FileX size={48} color="#d2d2d7" style={{marginBottom: 16}} />
            <div style={{fontSize: '16px', fontWeight: '500', color: '#1d1d1f'}}>Tidak ada dokumen bermasalah</div>
            <p style={{margin: '8px 0 0 0'}}>Semua dokumen ekspor saat ini telah lengkap dan terverifikasi.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Task Ekspor</th>
                <th style={styles.th}>Nama Dokumen</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {/* Data will be rendered here */}
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
  emptyState: { padding: '80px 20px', textAlign: 'center', color: '#86868b' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#86868b', borderBottom: '1px solid #e5e5ea', background: '#fafafa' }
};

export default AeMissingDocumentsDashboard;
