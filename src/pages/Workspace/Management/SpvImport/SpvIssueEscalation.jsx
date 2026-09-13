import React, { useState } from 'react';
import ManagementWorkspace from '../../../../components/ManagementWorkspace';
import { AlertTriangle, AlertCircle, ShieldAlert, ChevronRight } from 'lucide-react';
import useSPVData from '../../../../hooks/useSPVData';
import { api } from '../../../../lib/api';
import { useAppleModal } from '../../../../contexts/AppleModalContext';

const SpvIssueEscalation = () => {
  const { data: tasks, loading: l1, refetch: refetchTasks } = useSPVData('/api/tasks');
  const { data: shipments, loading: l2 } = useSPVData('/api/import-shipments');

  const [processingId, setProcessingId] = useState(null);
  const { alert } = useAppleModal();

  if (l1 || l2) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat Issue Escalation...</div>;

  const handleEscalate = async (issueId) => {
    try {
      setProcessingId(issueId);
      const issue = issues.find(i => i.id === issueId);
      if (!issue) throw new Error("Issue tidak ditemukan");

      // Replace mock with real API call creating a Problem Report
      await api('/reports', { 
        method: 'POST',
        body: JSON.stringify({
          tipe: 'Problem Report',
          judul: `ESCALATION: ${issue.type} - ${issue.reference}`,
          isi: `Mohon review issue berikut:\n\nKategori: ${issue.type}\nReferensi: ${issue.reference}\nDeskripsi: ${issue.description}\nPIC: ${issue.pic}\nTanggal Issue: ${new Date(issue.date).toLocaleDateString('id-ID')}`,
          departemen: user?.departemen
        })
      });
      await alert('Issue berhasil dieskalasi ke Manager (Tercatat sebagai Problem Report).');
      // Refresh data
      refetchTasks();
    } catch (err) {
      await alert(`Gagal eskalasi: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Aggregate Issues
  const issues = [];
  const now = new Date();

  // 1. Overdue Tasks
  const activeTasks = (tasks || []).filter(t => t.status !== 'Selesai');
  activeTasks.forEach(t => {
    if (t.tenggat && new Date(t.tenggat) < now) {
      issues.push({
        id: `TSK-${t.id}`,
        type: 'Overdue Task',
        reference: t.task_code || `TSK-${t.id}`,
        description: `Task "${t.judul}" overdue.`,
        severity: 'Medium',
        date: t.tenggat,
        pic: t.assignee_nama || 'Unassigned'
      });
    }
  });

  // 2. Delayed ETA
  (shipments || []).forEach(s => {
    if (s.eta && new Date(s.eta) < now && s.stage !== 'Status Complete') {
      issues.push({
        id: `SHP-${s.id}`,
        type: 'Delayed ETA',
        reference: s.un || s.id,
        description: `ETA terlewat: ${new Date(s.eta).toLocaleDateString('id-ID')}`,
        severity: 'High',
        date: s.eta,
        pic: 'Operation Team'
      });
    }
  });

  issues.sort((a, b) => new Date(b.date) - new Date(a.date));

  const criticalIssues = issues.filter(i => i.severity === 'Critical');
  const highIssues = issues.filter(i => i.severity === 'High');

  return (
    <ManagementWorkspace
      title="Issue & Escalation Center"
      subtitle={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Pusat pemantauan isu operasional, bottleneck, dan eskalasi ke level Manager.</span>
          <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '8px' }}>
            Data ini juga terlihat di Manager Dashboard → Laporan Departemen
          </span>
        </div>
      }
      summaryCards={[
        { label: 'Total Issues', value: issues.length.toString(), trend: 'Active', trendColor: '#ff9500', icon: <AlertTriangle size={20} /> },
        { label: 'High Priority', value: highIssues.length.toString(), trend: 'Needs Action', trendColor: '#ff3b30', icon: <AlertCircle size={20} /> },
        { label: 'Critical / Field', value: criticalIssues.length.toString(), trend: 'Immediate', trendColor: '#ff3b30', icon: <ShieldAlert size={20} /> },
      ]}
      tableConfig={{
        headers: ['Ref', 'Type', 'Description', 'Severity', 'Date / Target', 'PIC', 'Aksi'],
        data: issues,
        renderRow: (item, idx, onDetail) => (
          <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
            <td style={{ padding: '14px 24px', fontWeight: '600', color: 'var(--color-primary)' }}>{item.reference}</td>
            <td style={{ padding: '14px 24px' }}>{item.type}</td>
            <td style={{ padding: '14px 24px' }}>{item.description}</td>
            <td style={{ padding: '14px 24px' }}>
              <span style={{ 
                backgroundColor: item.severity === 'Critical' ? '#ffebee' : item.severity === 'High' ? '#fff2e0' : '#f5f5f5', 
                color: item.severity === 'Critical' ? '#f44336' : item.severity === 'High' ? '#ff9500' : 'var(--color-ink)', 
                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' 
              }}>
                {item.severity}
              </span>
            </td>
            <td style={{ padding: '14px 24px', color: 'var(--color-ink-muted-80)' }}>
              {new Date(item.date).toLocaleDateString('id-ID')}
            </td>
            <td style={{ padding: '14px 24px' }}>{item.pic}</td>
            <td style={{ padding: '14px 24px', display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => handleEscalate(item.id)}
                disabled={processingId === item.id}
                style={{ border: '1px solid #ff3b30', backgroundColor: processingId === item.id ? '#f5f5f5' : '#fff0f0', color: '#ff3b30', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', cursor: processingId === item.id ? 'not-allowed' : 'pointer' }}
              >
                {processingId === item.id ? 'Loading...' : 'Escalate'}
              </button>
              <button onClick={() => onDetail && onDetail()} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                Detail <ChevronRight size={14} />
              </button>
            </td>
          </tr>
        )
      }}
    />
  );
};

export default SpvIssueEscalation;
