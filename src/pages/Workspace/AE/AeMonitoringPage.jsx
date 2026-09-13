import React from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

const AeMonitoringPage = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Monitoring Administrasi</h1>
          <p style={styles.subtitle}>Pemantauan keseluruhan status administratif dari operasi ekspor</p>
        </div>
      </header>

      <div style={styles.emptyState}>
        <Activity size={48} color="#d2d2d7" style={{marginBottom: 16}} />
        <div style={{fontSize: '16px', fontWeight: '500', color: '#1d1d1f'}}>Dashboard Kosong</div>
        <p style={{margin: '8px 0 0 0'}}>Belum ada aktivitas ekspor yang membutuhkan pengawasan administratif.</p>
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

export default AeMonitoringPage;
