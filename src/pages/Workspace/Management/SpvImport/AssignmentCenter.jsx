import React, { useState } from 'react';
import ManagementWorkspace from '../../../../components/ManagementWorkspace';
import { Users, AlertCircle, Plus, ChevronRight } from 'lucide-react';
import useAuthStore from '../../../../store/useAuthStore';
import useSPVData from '../../../../hooks/useSPVData';
import { formatEximDate } from '../../../../utils/dateUtils';
import AssignTaskModal from '../../../../components/SPV/AssignTaskModal';
import { StatusBadge } from '../../../../components/SPV/SPVSharedComponents';

const AssignmentCenter = () => {
  const { user } = useAuthStore();
  const { data: tasks, loading, error, refetch } = useSPVData('/api/tasks?assigned_by_me=true&sumber_tugas=Escalation');
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat Assignment Center...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>;

  const escalations = tasks || [];
  const activeEscalations = escalations.filter(t => t.status !== 'Selesai');
  const completedEscalations = escalations.filter(t => t.status === 'Selesai');

  return (
    <>
    <ManagementWorkspace
      title="Assignment Center"
      subtitle={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Tugas yang Anda tugaskan (Escalation) kepada staff departemen {user?.departemen}.</span>
          <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '8px' }}>
            Data ini juga terlihat di Manager Dashboard → Laporan Departemen {user?.departemen}
          </span>
        </div>
      }
      summaryCards={[
        { label: 'Total Escalations', value: escalations.length.toString(), trend: 'All time', trendColor: '#0066cc', icon: <Users size={20} /> },
        { label: 'Active Escalations', value: activeEscalations.length.toString(), trend: 'In Progress', trendColor: '#ff9500', icon: <AlertCircle size={20} /> },
        { label: 'Completed', value: completedEscalations.length.toString(), trend: 'Resolved', trendColor: '#34c759', icon: <ChevronRight size={20} /> }
      ]}
      tableConfig={{
        headers: ['Task ID', 'Judul Tugas', 'Assignee', 'Tenggat Waktu', 'Status', 'Aksi'],
        data: escalations,
        renderRow: (item, idx, onDetail) => (
          <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
            <td style={{ padding: '14px 24px', fontWeight: '600', color: 'var(--color-primary)' }}>{item.task_code}</td>
            <td style={{ padding: '14px 24px' }}>{item.judul}</td>
            <td style={{ padding: '14px 24px' }}>{item.assignee_nama || 'Unassigned'}</td>
            <td style={{ padding: '14px 24px', color: 'var(--color-ink-muted-80)' }}>{formatEximDate(item.tenggat)}</td>
            <td style={{ padding: '14px 24px' }}>
              <StatusBadge status={item.status} />
            </td>
            <td style={{ padding: '14px 24px' }}>
              <button onClick={() => onDetail && onDetail()} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center' }}>Detail <ChevronRight size={14} /></button>
            </td>
          </tr>
        )
      }}
      actionPanel={
        <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Tindakan Cepat</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ width: '100%', padding: '12px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', marginBottom: '12px' }}
          >
            <Plus size={16} /> Assign New Task
          </button>
        </div>
      }
    />
    <AssignTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); refetch(); }} />
    </>
  );
};

export default AssignmentCenter;
