import React from 'react';
import { Timer, AlertTriangle } from 'lucide-react';

const AeSlaDeadlinesPage = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Tenggat Waktu SLA</h1>
          <p style={styles.subtitle}>Pemantauan indikator kinerja SLA dan tenggat waktu operasional Administratif Ekspor</p>
        </div>
      </header>

      <div style={styles.emptyState}>
        <Timer size={48} color="#d2d2d7" style={{marginBottom: 16}} />
        <div style={{fontSize: '16px', fontWeight: '500', color: '#1d1d1f'}}>SLA Terkendali</div>
        <p style={{margin: '8px 0 0 0'}}>Saat ini tidak ada pekerjaan Administrasi Ekspor yang mendekati tenggat SLA.</p>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: '#86868b', margin: 0 },
  emptyState: { padding: '100px 20px', textAlign: 'center', background: '#f5f5f7', borderRadius: '16px', color: '#86868b' }
};

export default AeSlaDeadlinesPage;
