import React, { useState, useEffect } from 'react';
import { 
  Users, Inbox, ArrowRight, AlertCircle, Clock
} from 'lucide-react';
import api from '../../../lib/api';

const AeQueuePoolPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ae/tasks/queue-pool');
      setTasks(res.data.data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (taskId) => {
    try {
      await api.post(`/ae/tasks/${taskId}/claim`);
      fetchQueue();
    } catch (err) {
      alert('Gagal mengambil tugas.');
    }
  };

  if (loading) return <div style={styles.loading}>Memuat antrean...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Queue Pool</h1>
          <p style={styles.subtitle}>Tugas Administrasi Ekspor yang belum ditugaskan</p>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>Menunggu Eksekusi</span>
          <span style={styles.statValue}>{tasks.length}</span>
        </div>
      </header>

      <div style={styles.taskList}>
        {tasks.length === 0 ? (
          <div style={styles.emptyState}>
            <Inbox size={48} color="#d2d2d7" style={{marginBottom: 16}} />
            <div>Tidak ada tugas di dalam antrean.</div>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} style={styles.taskCard}>
              <div style={styles.taskInfo}>
                <h3 style={styles.taskTitle}>{task.judul}</h3>
                <div style={styles.taskMeta}>
                  <span style={styles.badge}>{task.prioritas}</span>
                  <span style={styles.deadline}>
                    <Clock size={14} /> {new Date(task.tenggat).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
              <button style={styles.claimBtn} onClick={() => handleClaim(task.id)}>
                Ambil Tugas <ArrowRight size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '24px 32px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: '#86868b', margin: 0 },
  statBox: { background: '#f5f5f7', padding: '12px 20px', borderRadius: '12px', textAlign: 'center' },
  statLabel: { fontSize: '12px', color: '#86868b', fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: '24px', fontWeight: '700', color: '#1d1d1f' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  taskCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e5e5ea', padding: '20px', borderRadius: '12px' },
  taskInfo: { display: 'flex', flexDirection: 'column', gap: '8px' },
  taskTitle: { margin: 0, fontSize: '16px', fontWeight: '600' },
  taskMeta: { display: 'flex', gap: '12px', alignItems: 'center' },
  badge: { padding: '2px 8px', background: '#f5f5f7', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
  deadline: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#86868b' },
  claimBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '14px', cursor: 'pointer' },
  emptyState: { padding: '60px', textAlign: 'center', background: '#f5f5f7', borderRadius: '16px', color: '#86868b' },
  loading: { padding: '40px', textAlign: 'center' }
};

export default AeQueuePoolPage;
