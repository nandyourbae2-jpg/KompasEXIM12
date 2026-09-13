import React from 'react';
import { Archive, Search } from 'lucide-react';

const AeDocumentArchivePage = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Arsip & Versi Berkas</h1>
          <p style={styles.subtitle}>Pusat penyimpanan riwayat dan versi dokumen administrasi ekspor</p>
        </div>
      </header>

      <div style={styles.searchBox}>
        <Search size={18} color="#86868b" />
        <input type="text" placeholder="Cari nomor ekspor atau nama dokumen..." style={styles.searchInput} />
      </div>

      <div style={styles.emptyState}>
        <Archive size={48} color="#d2d2d7" style={{marginBottom: 16}} />
        <div style={{fontSize: '16px', fontWeight: '500', color: '#1d1d1f'}}>Arsip Kosong</div>
        <p style={{margin: '8px 0 0 0'}}>Belum ada riwayat arsip yang tersimpan di sistem.</p>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: '#86868b', margin: 0 },
  searchBox: { display: 'flex', alignItems: 'center', background: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e5ea', gap: '8px', marginBottom: '24px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '15px' },
  emptyState: { padding: '100px 20px', textAlign: 'center', background: '#f5f5f7', borderRadius: '16px', color: '#86868b' }
};

export default AeDocumentArchivePage;
