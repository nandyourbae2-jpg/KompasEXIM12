import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, Play, 
  Search, Filter, ChevronRight, FileText
} from 'lucide-react';
import api from '../../../lib/api';
import useAuthStore from '../../../store/useAuthStore';

const AeMyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ae/tasks/my-tasks');
      setTasks(res.data.data.tasks || []);
    } catch (err) {
      setError('Gagal memuat tugas AE.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Memuat tugas Anda...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>My Tasks</h1>
          <p style={styles.subtitle}>Tugas operasional Administrasi Ekspor yang menjadi tanggung jawab Anda</p>
        </div>
        <div style={styles.summaryStats}>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Tugas Aktif</span>
            <span style={styles.statValue}>{tasks.length}</span>
          </div>
        </div>
      </header>

      <div style={styles.filters}>
        <div style={styles.searchBox}>
          <Search size={18} color="#86868b" />
          <input type="text" placeholder="Cari tugas atau referensi ekspor..." style={styles.searchInput} />
        </div>
        <button style={styles.filterBtn}>
          <Filter size={16} /> Filter
        </button>
      </div>

      <div style={styles.taskList}>
        {tasks.length === 0 ? (
          <div style={styles.emptyState}>Belum ada tugas yang dialokasikan kepada Anda.</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} style={styles.taskCard}>
              <div style={styles.taskHeader}>
                <div style={styles.taskTitleGroup}>
                  <div style={styles.taskIcon}><FileText size={20} color="#0066cc" /></div>
                  <div>
                    <h3 style={styles.taskTitle}>{task.judul}</h3>
                    <p style={styles.taskRef}>Ref: {task.reference_id || 'N/A'}</p>
                  </div>
                </div>
                <div style={styles.badgeGroup}>
                  <span style={styles.badge}>{task.prioritas}</span>
                  <span style={{...styles.badge, ...styles.statusBadge(task.status)}}>{task.status}</span>
                </div>
              </div>
              
              <div style={styles.taskFooter}>
                <div style={styles.deadline}>
                  <Clock size={14} color="#86868b" />
                  <span>Tenggat: {new Date(task.tenggat).toLocaleDateString('id-ID')}</span>
                </div>
                <button style={styles.actionBtn}>
                  {task.status === 'Open' ? 'Mulai Kerjakan' : 'Lanjutkan'} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px 32px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1d1d1f',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '15px',
    color: '#86868b',
    margin: 0
  },
  statBox: {
    background: '#f5f5f7',
    padding: '12px 20px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statLabel: {
    fontSize: '12px',
    color: '#86868b',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1d1d1f'
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: '#f5f5f7',
    padding: '8px 16px',
    borderRadius: '8px',
    flex: 1,
    gap: '8px'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    width: '100%',
    fontSize: '15px'
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #d2d2d7',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  taskCard: {
    background: '#fff',
    border: '1px solid #e5e5ea',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  taskTitleGroup: {
    display: 'flex',
    gap: '16px'
  },
  taskIcon: {
    width: '40px',
    height: '40px',
    background: '#e8f2fc',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  taskTitle: {
    margin: '0 0 4px 0',
    fontSize: '17px',
    fontWeight: '600',
    color: '#1d1d1f'
  },
  taskRef: {
    margin: 0,
    fontSize: '13px',
    color: '#86868b'
  },
  badgeGroup: {
    display: 'flex',
    gap: '8px'
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    background: '#f5f5f7',
    color: '#1d1d1f'
  },
  statusBadge: (status) => {
    switch (status) {
      case 'Open': return { background: '#fdf0d5', color: '#945c05' };
      case 'In Progress': return { background: '#e8f2fc', color: '#0066cc' };
      case 'Selesai': return { background: '#e3f5eb', color: '#137333' };
      default: return {};
    }
  },
  taskFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f5f5f7'
  },
  deadline: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#86868b'
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: '#0066cc',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#86868b'
  },
  error: {
    padding: '40px',
    textAlign: 'center',
    color: '#ff3b30'
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    background: '#f5f5f7',
    borderRadius: '16px',
    color: '#86868b',
    fontSize: '15px'
  }
};

export default AeMyTasksPage;
