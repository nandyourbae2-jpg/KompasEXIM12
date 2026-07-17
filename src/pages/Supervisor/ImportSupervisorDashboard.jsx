import React, { useState, useMemo } from 'react';
import useImportOperationalStore from '../../store/useImportOperationalStore';
import useTaskStore from '../../store/useTaskStore';
import useAuthStore from '../../store/useAuthStore';
import useReportStore from '../../store/useReportStore';
import TaskFormModal from '../../components/TaskFormModal';
import { Ship, AlertTriangle, Users, Target, Activity, FileText, X } from 'lucide-react';
import { getSupervisorPageTitle } from '../../utils/authHelpers';
import { getUserName } from '../../utils/userLookup';

const ImportSupervisorDashboard = () => {
  const { shipments } = useImportOperationalStore();
  const { tasks } = useTaskStore();
  const { user, getStaffByDept } = useAuthStore();
  const { getComputedReports, addReport } = useReportStore();
  const reports = getComputedReports();
  
  const [assignModal, setAssignModal] = useState({ isOpen: false, defaultAssignee: '' });
  const [kpiModal, setKpiModal] = useState({ isOpen: false, type: '' });
  const [reportModal, setReportModal] = useState(false);
  const [newReport, setNewReport] = useState({ reportType: 'Weekday Report', title: '', desc: '', impNumber: '' });

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  const currentYear = today.getFullYear();
  
  const deptStaff = getStaffByDept(user?.departemen || 'Import');

  const staffPerformance = deptStaff.map(staff => {
    const staffTasks = tasks.filter(t => t.department === user?.departemen && t.assigneeId === staff.id);
    const active = staffTasks.filter(t => t.status !== 'Selesai');
    const done = staffTasks.filter(t => t.status === 'Selesai');
    
    let overdue = 0;
    active.forEach(t => {
      if (t.dueDate) {
        const due = new Date(`${t.dueDate} ${currentYear}`);
        if (due < today) overdue++;
      }
    });

    const completionRate = staffTasks.length === 0 ? 0 : Math.round((done.length / staffTasks.length) * 100);

    return {
      id: staff.id,
      name: staff.name,
      total: staffTasks.length,
      active: active.length,
      done: done.length,
      overdue,
      completionRate
    };
  });

  const totalStaff = deptStaff.length;
  const deptTasks = tasks.filter(t => t.department === user?.departemen);
  const totalActiveTasks = deptTasks.filter(t => t.status !== 'Selesai').length;
  const totalOverdueTasks = deptTasks.filter(t => t.status !== 'Selesai' && t.dueDate && new Date(`${t.dueDate} ${currentYear}`) < today).length;
  
  const activeShipments = useMemo(() => shipments.filter(s => s.status !== 'Completed'), [shipments]);
  const activeBlCount = activeShipments.length;
  const activeContCount = activeShipments.reduce((sum, s) => sum + (s.containers?.length || 0), 0);

  const latestReports = reports.filter(r => r.departemen === user?.departemen).slice(0, 5);

  const handleAssignTask = (staffId) => {
    setAssignModal({ isOpen: true, defaultAssignee: staffId });
  };

  const handleKpiClick = (type) => {
    setKpiModal({ isOpen: true, type });
  };

  const handleSaveReport = (e) => {
    e.preventDefault();
    if (!newReport.title || !newReport.desc) return;
    addReport({
      report_type: newReport.reportType,
      judul: newReport.title,
      isi: newReport.desc,
      imp_number: newReport.impNumber,
      departemen: user?.departemen,
      created_by: 'Supervisor Import',
      target_dashboard: 'Manager'
    });
    setReportModal(false);
    setNewReport({ reportType: 'Weekday Report', title: '', desc: '', impNumber: '' });
  };

  return (
    <div style={{ backgroundColor: 'var(--color-canvas-parchment)', minHeight: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-family-body)' }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: '34px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 8px 0', letterSpacing: '-0.374px' }}>
            {getSupervisorPageTitle('Control Tower', user)}
          </h1>
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', margin: '0' }}>
            Pengawasan Kinerja, Penugasan Eskalasi, & Ringkasan Operasional
          </p>
        </div>
        <button 
          onClick={() => handleAssignTask('')}
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--rounded-pill)', padding: '11px 22px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          + Assign Tugas
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {/* Card 1: Total Staff */}
          <div 
            onClick={() => handleKpiClick('staff')}
            style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '170px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-status-info-bg)', color: 'var(--color-status-info)', flexShrink: 0 }}>
                <Users size={20}/>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Staff</span>
            </div>
            <div>
              <div style={{ fontSize: '34px', fontWeight: '600', color: 'var(--color-ink)', lineHeight: '1', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {totalStaff} <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>Orang</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', marginTop: '8px' }}>
                Aktif di departemen ini
              </div>
            </div>
          </div>
          
          {/* Card 2: Tugas Aktif */}
          <div 
            onClick={() => handleKpiClick('active')}
            style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '170px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-status-info-bg)', color: 'var(--color-status-info)', flexShrink: 0 }}>
                <Target size={20}/>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tugas Aktif</span>
            </div>
            <div>
              <div style={{ fontSize: '34px', fontWeight: '600', color: 'var(--color-ink)', lineHeight: '1', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {totalActiveTasks} <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>Tugas</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', marginTop: '8px' }}>
                Termasuk semua prioritas
              </div>
            </div>
          </div>

          {/* Card 3: Overdue */}
          <div 
            onClick={() => handleKpiClick('overdue')}
            style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '170px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: totalOverdueTasks > 0 ? 'var(--color-status-danger-bg)' : 'var(--color-status-info-bg)', color: totalOverdueTasks > 0 ? 'var(--color-status-danger)' : 'var(--color-status-info)' }}>
                <AlertTriangle size={20}/>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overdue</span>
            </div>
            <div>
              <div style={{ fontSize: '34px', fontWeight: '600', color: totalOverdueTasks > 0 ? 'var(--color-status-danger)' : 'var(--color-ink)', lineHeight: '1', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {totalOverdueTasks} <span style={{ fontSize: '16px', fontWeight: '600', color: totalOverdueTasks > 0 ? 'var(--color-status-danger)' : 'var(--color-ink-muted-80)' }}>Tugas</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: totalOverdueTasks > 0 ? 'var(--color-status-danger)' : 'var(--color-ink-muted-48)', marginTop: '8px' }}>
                Perlu tindakan segera
              </div>
            </div>
          </div>

          {/* Card 4: Shipment Aktif */}
          <div 
            onClick={() => handleKpiClick('shipment')}
            style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '170px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-status-info-bg)', color: 'var(--color-status-info)', flexShrink: 0 }}>
                <Ship size={20}/>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shipment Aktif</span>
            </div>
            <div>
              <div style={{ fontSize: '34px', fontWeight: '600', color: 'var(--color-ink)', lineHeight: '1', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {activeBlCount} <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>B/L</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', marginTop: '8px' }}>
                Total {activeContCount} Kontainer
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* KINERJA STAFF TABLE */}
          <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ borderBottom: '1px solid var(--color-hairline)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--color-canvas-parchment)' }}>
              <Activity size={20} color="var(--color-primary)" />
              <h3 style={{ margin: '0', fontSize: '17px', fontWeight: '600', color: 'var(--color-ink)' }}>Kinerja Staff</h3>
            </div>
            <div style={{ overflowX: 'auto', padding: '24px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', paddingBottom: '12px' }}>Nama Staff</th>
                    <th style={{ borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', paddingBottom: '12px' }}>Tugas Aktif</th>
                    <th style={{ borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', paddingBottom: '12px' }}>Selesai</th>
                    <th style={{ borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', paddingBottom: '12px' }}>Overdue</th>
                    <th style={{ borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', paddingBottom: '12px', width: '25%' }}>Completion</th>
                    <th style={{ borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', paddingBottom: '12px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPerformance.map((staff, idx) => (
                    <tr key={idx} style={{ borderBottom: idx !== staffPerformance.length - 1 ? '1px solid var(--color-hairline)' : 'none' }}>
                      <td style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', padding: '12px 0' }}>{staff.name} {staff.status_aktif === false && <span style={{marginLeft:'4px', fontSize:'10px', padding:'2px 4px', backgroundColor:'#fee2e2', color:'#ef4444', borderRadius:'4px'}}>Nonaktif</span>}</td>
                      <td style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', padding: '12px 0' }}>{staff.active}</td>
                      <td style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-status-success)', padding: '12px 0' }}>{staff.done}</td>
                      <td style={{ fontSize: '14px', fontWeight: '600', color: staff.overdue > 0 ? 'var(--color-status-danger)' : 'var(--color-ink-muted-48)', padding: '12px 0' }}>
                        {staff.overdue}
                      </td>
                      <td style={{ padding: '12px 16px 12px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-pill)', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                borderRadius: 'var(--rounded-pill)', 
                                backgroundColor: staff.completionRate === 100 ? 'var(--color-status-success)' : 'var(--color-primary)',
                                width: `${staff.completionRate}%` 
                              }} 
                            />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', width: '32px' }}>{staff.completionRate}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleAssignTask(staff.id)} 
                          style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)', backgroundColor: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* LAPORAN TERBARU */}
          <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', display: 'flex', flexDirection: 'column', height: '500px', overflow: 'hidden' }}>
            <div style={{ borderBottom: '1px solid var(--color-hairline)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--color-canvas-parchment)', flexShrink: 0 }}>
              <FileText size={20} color="var(--color-primary)" />
              <h3 style={{ margin: '0', fontSize: '17px', fontWeight: '600', color: 'var(--color-ink)' }}>Laporan SPV Terbaru</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {latestReports.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-ink-muted-80)', fontSize: '14px', padding: '32px', fontWeight: '600' }}>Belum ada laporan.</div>
              ) : (
                latestReports.map((report, i) => (
                  <div key={report.id} style={{ borderBottom: i !== latestReports.length - 1 ? '1px solid var(--color-hairline)' : 'none', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(() => {
                          const type = report.report_type || report.tipe;
                          let bg = 'var(--color-status-neutral-bg)', color = 'var(--color-ink-muted-80)';
                          if (type === 'Weekday Report') { bg = 'var(--color-status-neutral-bg)'; color = 'var(--color-ink)'; }
                          else if (type === 'Problem Report') { bg = 'var(--color-status-danger-bg)'; color = 'var(--color-status-danger)'; }
                          else if (type === 'Progress Problem') { bg = 'var(--color-status-warning-bg)'; color = 'var(--color-status-warning)'; }
                          else if (type === 'Solve Update') { bg = 'var(--color-status-success-bg)'; color = 'var(--color-status-success)'; }
                          else if (type === 'Operasional') { bg = 'var(--color-status-info-bg)'; color = 'var(--color-status-info)'; }
                          else if (type === 'Financial') { bg = 'var(--color-status-neutral-bg)'; color = 'var(--color-ink)'; }
                          else if (type === 'Team') { bg = '#fce7f3'; color = '#be185d'; }
                          
                          return (
                            <span style={{ backgroundColor: bg, color: color, padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', fontWeight: '600' }}>
                              {type}
                            </span>
                          );
                        })()}
                        {(report.report_type || report.tipe) === 'Problem Report' && report.status && (
                          <span style={{ padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', fontWeight: '600', backgroundColor: report.status === 'Open' ? 'var(--color-status-danger-bg)' : 'var(--color-status-success-bg)', color: report.status === 'Open' ? 'var(--color-status-danger)' : 'var(--color-status-success)' }}>
                            {report.status}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', marginTop: '2px' }}>
                        {new Date(report.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 4px 0', lineHeight: '1.43' }}>
                      {report.judul}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.43' }}>
                      {report.isi}
                    </p>
                    {report.tanggapan_manager && (
                      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Tanggapan Manager</div>
                        <p style={{ fontSize: '12px', color: 'var(--color-ink)', margin: '0', lineHeight: '1.43' }}>{report.tanggapan_manager}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => setReportModal(true)}
              style={{ width: '100%', backgroundColor: 'var(--color-canvas-parchment)', border: 'none', borderTop: '1px solid var(--color-hairline)', color: 'var(--color-primary)', fontSize: '14px', fontWeight: '600', padding: '16px', flexShrink: 0, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }} 
            >
              Buat Laporan Baru
            </button>
          </div>

        </div>
      </div>

      {/* KPI MODAL */}
      {kpiModal.isOpen && (
        <div style={{ position: 'fixed', inset: '0', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', padding: '24px' }} onClick={() => setKpiModal({ isOpen: false, type: '' })}>
          <div style={{ backgroundColor: 'var(--color-canvas)', width: '100%', maxWidth: '600px', borderRadius: 'var(--rounded-lg)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)' }}>
              <h2 style={{ margin: '0', fontSize: '17px', fontWeight: '600', color: 'var(--color-ink)' }}>
                {kpiModal.type === 'staff' && 'Detail Total Staff'}
                {kpiModal.type === 'active' && 'Detail Tugas Aktif'}
                {kpiModal.type === 'overdue' && 'Detail Tugas Overdue'}
                {kpiModal.type === 'shipment' && 'Detail Shipment Aktif'}
              </h2>
              <button onClick={() => setKpiModal({ isOpen: false, type: '' })} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--color-ink-muted-48)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
              {kpiModal.type === 'overdue' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {tasks.filter(t => t.department === user?.departemen && t.status !== 'Selesai' && t.dueDate && new Date(`${t.dueDate} ${currentYear}`) < today).map(task => (
                    <div key={task.id} style={{ backgroundColor: 'var(--color-status-danger-bg)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{task.title}</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-status-danger)', backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 'var(--rounded-sm)', padding: '4px 8px' }}>Late: {task.dueDate}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', fontWeight: '600', display: 'flex', gap: '12px' }}>
                        <span>PIC: <span style={{ color: 'var(--color-ink)' }}>{getUserName(task.assigneeId)}</span></span>
                        {task.importProjectId && <span>IMP: {task.importProjectId}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {kpiModal.type === 'staff' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {deptStaff.map(s => <div key={s.name} style={{ backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', border: '1px solid var(--color-hairline)' }}>{s.name}</div>)}
                </div>
              )}
              {kpiModal.type === 'active' && (
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textAlign: 'center', padding: '24px 0' }}>Menampilkan total penugasan yang masih berjalan.</div>
              )}
              {kpiModal.type === 'shipment' && (
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textAlign: 'center', padding: '24px 0' }}>Daftar shipment dalam status aktif.</div>
              )}
            </div>
            <div style={{ padding: '24px', borderTop: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', justifyItems: 'flex-end', justifyContent: 'flex-end' }}>
              <button onClick={() => setKpiModal({ isOpen: false, type: '' })} style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-on-dark)', border: 'none', borderRadius: 'var(--rounded-sm)', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportModal && (
        <div style={{ position: 'fixed', inset: '0', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', padding: '24px' }} onClick={() => setReportModal(false)}>
          <div style={{ backgroundColor: 'var(--color-canvas)', width: '100%', maxWidth: '600px', borderRadius: 'var(--rounded-lg)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)' }}>
              <h2 style={{ margin: '0', fontSize: '17px', fontWeight: '600', color: 'var(--color-ink)' }}>Buat Laporan Baru</h2>
              <button onClick={() => setReportModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--color-ink-muted-48)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveReport} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', marginBottom: '8px' }}>Jenis Laporan</label>
                <select 
                  value={newReport.reportType} 
                  onChange={e => setNewReport({...newReport, reportType: e.target.value})}
                  style={{ width: '100%', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', outline: 'none' }}
                >
                  <option value="Weekday Report">Weekday Report</option>
                  <option value="Problem Report">Problem Report</option>
                  <option value="Progress Problem">Progress Problem</option>
                  <option value="Solve Update">Solve Update</option>
                  <option value="Operasional">Operasional</option>
                  <option value="Financial">Financial</option>
                  <option value="Team">Team</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', marginBottom: '8px' }}>Judul Laporan</label>
                <input 
                  type="text" 
                  required
                  value={newReport.title} 
                  onChange={e => setNewReport({...newReport, title: e.target.value})}
                  style={{ width: '100%', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Contoh: Update DO tertunda"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', marginBottom: '8px' }}>Deskripsi Detail</label>
                <textarea 
                  required
                  rows={4}
                  value={newReport.desc} 
                  onChange={e => setNewReport({...newReport, desc: e.target.value})}
                  style={{ width: '100%', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  placeholder="Ceritakan detail kronologi..."
                />
              </div>
              {newReport.reportType !== 'Team' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', marginBottom: '8px' }}>Tautkan ke IMP Number (Opsional)</label>
                  <select 
                    value={newReport.impNumber} 
                    onChange={e => setNewReport({...newReport, impNumber: e.target.value})}
                    style={{ width: '100%', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', outline: 'none' }}
                  >
                    <option value="">-- Pilih Project IMP --</option>
                    {activeShipments.map(s => (
                      <option key={s.id} value={s.importProjectId || s.id}>{s.importProjectId || s.id} - {s.supplier}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-hairline)' }}>
                <button type="button" onClick={() => setReportModal(false)} style={{ borderRadius: 'var(--rounded-sm)', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', cursor: 'pointer', padding: '8px 16px' }}>Batal</button>
                <button type="submit" style={{ borderRadius: 'var(--rounded-sm)', fontSize: '14px', fontWeight: '600', color: 'var(--color-on-dark)', backgroundColor: 'var(--color-ink)', border: 'none', cursor: 'pointer', padding: '8px 16px' }}>Simpan Laporan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TaskFormModal 
        isOpen={assignModal.isOpen} 
        onClose={() => setAssignModal({ isOpen: false, defaultAssignee: '' })}
        defaultAssignee={assignModal.defaultAssignee}
      />
    </div>
  );
};

export default ImportSupervisorDashboard;
