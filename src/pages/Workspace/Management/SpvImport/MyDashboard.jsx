import React, { useState, useEffect } from 'react';
import ManagementWorkspace from '../../../../components/ManagementWorkspace';
import useAuthStore from '../../../../store/useAuthStore';
import useSPVData from '../../../../hooks/useSPVData';
import { CheckSquare, AlertTriangle, TrendingDown, Calendar, Users, Activity } from 'lucide-react';
import { StatusBadge } from '../../../../components/SPV/SPVSharedComponents';
import { api } from '../../../../lib/api';
import { useAppleModal } from '../../../../contexts/AppleModalContext';

const MyDashboard = () => {
  const { user } = useAuthStore();
  const dept = user?.departemen;

  // Fetch the new transparency metrics
  const { data: dashboardMetrics, loading: metricsLoading } = useSPVData(`/api/control-tower/spv-dashboard`);
  const { data: tasks, loading: tasksLoading } = useSPVData('/api/tasks');

  // Notes state
  const [notes, setNotes] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  
  // State for KPI Detail Modal
  const [selectedKpi, setSelectedKpi] = useState(null);
  const { alert } = useAppleModal();

  useEffect(() => {
    // Load notes from DB
    api('/me/notes').then(res => {
      setNotes(res.notes || '');
    }).catch(console.error);
  }, []);

  const handleSaveNotes = async () => {
    setIsSavingNote(true);
    try {
      await api('/me/notes', {
        method: 'PUT',
        body: JSON.stringify({ notes })
      });
      await alert('Catatan berhasil disimpan ke sistem.');
    } catch (e) {
      await alert('Gagal menyimpan catatan.');
    } finally {
      setIsSavingNote(false);
    }
  };

  if (metricsLoading || tasksLoading) return <div>Loading Control Tower Data...</div>;

  const myTasks = (tasks || []).filter(t => t.assignee_id === user?.id);
  const activeTasks = myTasks.filter(t => t.status !== 'Selesai');
  const highPriority = myTasks.filter(t => t.prioritas === 'Tinggi' && t.status !== 'Selesai');

  const { teamWorkload = [], demurrageRisks = [], costOverruns = [], todaySchedules = [] } = dashboardMetrics || {};

  return (
    <>
    <ManagementWorkspace
      title="Control Tower Dashboard"
      subtitle={`Selamat bekerja, ${user?.nama}. Pantau risiko finansial dan beban kerja tim secara real-time.`}
      summaryCards={[
        { label: "My Deadline", value: highPriority.length.toString(), trend: 'Prioritas Tinggi', trendColor: '#0066cc', icon: <CheckSquare size={20} />, onClick: () => setSelectedKpi('deadline') },
        { label: "Demurrage Risk", value: demurrageRisks.length.toString(), trend: demurrageRisks.length > 0 ? 'Urgent Action' : 'Aman', trendColor: demurrageRisks.length > 0 ? '#ff3b30' : '#34c759', icon: <AlertTriangle size={20} />, onClick: () => setSelectedKpi('demurrage') },
        { label: 'Cost Overrun', value: costOverruns.length.toString(), trend: costOverruns.length > 0 ? 'Melebihi Estimasi' : 'Sesuai Budget', trendColor: costOverruns.length > 0 ? '#ff9500' : '#34c759', icon: <TrendingDown size={20} />, onClick: () => setSelectedKpi('cost_overrun') },
        { label: 'Active Team Load', value: teamWorkload.reduce((a, b) => a + b.active_tasks, 0).toString(), trend: 'Total tugas staf', trendColor: '#8e8e93', icon: <Activity size={20} />, onClick: () => setSelectedKpi('workload') },
      ]}
      tableConfig={{
        headers: ['Task Code', 'Judul Tugas Anda', 'Prioritas', 'Status', 'Tenggat Waktu'],
        data: activeTasks.slice(0, 5), // show only top 5 personal tasks
        renderRow: (item) => (
          <tr key={item.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
            <td style={{ padding: '14px 24px', fontWeight: '600', color: 'var(--color-primary)' }}>{item.task_code}</td>
            <td style={{ padding: '14px 24px' }}>{item.judul}</td>
            <td style={{ padding: '14px 24px' }}>
              <span style={{ color: item.prioritas === 'Tinggi' || item.prioritas === 'Kritis' ? '#ff3b30' : 'var(--color-ink)' }}>{item.prioritas}</span>
            </td>
            <td style={{ padding: '14px 24px' }}><StatusBadge status={item.status} /></td>
            <td style={{ padding: '14px 24px', color: 'var(--color-ink-muted-80)' }}>{item.tenggat || '-'}</td>
          </tr>
        )
      }}
      actionPanel={
        <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Cloud Notes</h3>
            <button onClick={handleSaveNotes} disabled={isSavingNote} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              {isSavingNote ? 'Saving...' : 'Sync to Cloud'}
            </button>
          </div>
          <textarea 
            placeholder="Catatan tersimpan aman di database..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%', height: '220px', padding: '12px', borderRadius: 'var(--rounded-md)',
              border: '1px solid var(--color-hairline)', backgroundColor: '#fafafa',
              fontSize: '13px', fontFamily: 'inherit', resize: 'vertical'
            }}
          />
        </div>
      }
      customContent={
        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* TEAM WORKLOAD DISTRIBUTION */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Users size={18} color="var(--color-ink)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Team Workload Distribution</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {teamWorkload.length === 0 ? <div style={{ fontSize: '13px', color: '#888' }}>Tidak ada staf atau tugas.</div> : null}
              {teamWorkload.map(staff => {
                const maxTasks = Math.max(...teamWorkload.map(w => w.active_tasks), 10);
                const pct = (staff.active_tasks / maxTasks) * 100;
                return (
                  <div key={staff.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '80px', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {staff.nama}
                    </div>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: staff.active_tasks > 5 ? '#ff3b30' : '#0066cc' }} />
                    </div>
                    <div style={{ width: '40px', fontSize: '12px', textAlign: 'right', fontWeight: '600' }}>
                      {staff.active_tasks}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CRITICAL SCHEDULE & ALERTS */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Calendar size={18} color="var(--color-ink)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Timelines & Critical Alerts</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto' }}>
              
              {demurrageRisks.map(r => (
                <div key={'dem-'+r.id} style={{ padding: '12px', borderLeft: '4px solid #ff3b30', backgroundColor: '#fff5f5', borderRadius: '4px 8px 8px 4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#d70000' }}>🚨 Risiko Denda: {r.shipment_code}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '4px' }}>
                    Batas waktu di pelabuhan kurang dari {r.hari_tersisa} hari!
                  </div>
                </div>
              ))}

              {costOverruns.map(c => (
                <div key={'cost-'+c.id} style={{ padding: '12px', borderLeft: '4px solid #ff9500', backgroundColor: '#fffcf0', borderRadius: '4px 8px 8px 4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#b26800' }}>⚠️ Over-budget: {c.task_unique_number}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '4px' }}>
                    {c.keterangan} - Aktual melewati baseline.
                  </div>
                </div>
              ))}

              {todaySchedules.map(t => (
                <div key={'ts-'+t.id} style={{ padding: '12px', borderLeft: '4px solid #0066cc', backgroundColor: '#fafafa', borderRadius: '4px 8px 8px 4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>Tenggat Hari Ini: {t.judul}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '4px' }}>PIC: {t.assignee_nama} ({t.prioritas})</div>
                </div>
              ))}

              {demurrageRisks.length === 0 && costOverruns.length === 0 && todaySchedules.length === 0 && (
                <div style={{ fontSize: '13px', color: '#888', fontStyle: 'italic' }}>Semua timeline dan operasional aman.</div>
              )}
            </div>
          </div>

        </div>
      }
    />
    
    {/* KPI Detail Modal Overlay */}
    {selectedKpi && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>
              {selectedKpi === 'deadline' && 'Detail Tugas Prioritas Tinggi'}
              {selectedKpi === 'demurrage' && 'Detail Risiko Demurrage'}
              {selectedKpi === 'cost_overrun' && 'Detail Cost Overrun (Melebihi Estimasi)'}
              {selectedKpi === 'workload' && 'Detail Beban Kerja Tim'}
            </h2>
            <button onClick={() => setSelectedKpi(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>×</button>
          </div>
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {selectedKpi === 'deadline' && (
              highPriority.length === 0 ? <p style={{color: '#888'}}>Tidak ada tugas prioritas tinggi.</p> :
              highPriority.map(t => (
                <div key={t.id} style={{ padding: '12px', borderLeft: '4px solid #ff3b30', backgroundColor: '#fafafa' }}>
                  <strong>{t.task_code}</strong> - {t.judul}<br/>
                  <small>Tenggat: {t.tenggat || 'Belum diatur'}</small>
                </div>
              ))
            )}

            {selectedKpi === 'demurrage' && (
              demurrageRisks.length === 0 ? <p style={{color: '#888'}}>Tidak ada kontainer berisiko.</p> :
              demurrageRisks.map(r => (
                <div key={r.id} style={{ padding: '12px', borderLeft: '4px solid #ff3b30', backgroundColor: '#fff5f5' }}>
                  <strong>Shipment: {r.shipment_code}</strong> (Sisa {r.hari_tersisa} hari)<br/>
                  <small>Kedatangan (ATA): {r.ata} | Free Time: {r.free_time_destination} hari</small>
                </div>
              ))
            )}

            {selectedKpi === 'cost_overrun' && (
              costOverruns.length === 0 ? <p style={{color: '#888'}}>Tidak ada pengeluaran over-budget.</p> :
              costOverruns.map(c => (
                <div key={c.id} style={{ padding: '12px', borderLeft: '4px solid #ff9500', backgroundColor: '#fffcf0' }}>
                  <strong>{c.task_unique_number}</strong>: {c.keterangan}<br/>
                  <small>Vendor: {c.vendor_nama || '-'}</small><br/>
                  <small>Baseline: Rp {c.baseline_amount?.toLocaleString('id-ID')} | Aktual: Rp {c.actual_amount?.toLocaleString('id-ID')}</small>
                </div>
              ))
            )}

            {selectedKpi === 'workload' && (
              teamWorkload.length === 0 ? <p style={{color: '#888'}}>Tidak ada staf.</p> :
              teamWorkload.map(staff => (
                <div key={staff.id} style={{ padding: '12px', borderLeft: '4px solid #0066cc', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{staff.nama}</span>
                  <strong>{staff.active_tasks} Tugas Aktif</strong>
                </div>
              ))
            )}

          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-hairline)', backgroundColor: '#f9f9f9', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setSelectedKpi(null)} style={{ padding: '8px 16px', backgroundColor: 'var(--color-ink)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Tutup</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default MyDashboard;
