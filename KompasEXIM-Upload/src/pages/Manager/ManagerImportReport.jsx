import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useImportOperationalStore from '../../store/useImportOperationalStore';
import usePaymentStore from '../../store/usePaymentStore';
import useTaskStore from '../../store/useTaskStore';
import useAuthStore from '../../store/useAuthStore';
import useReportStore from '../../store/useReportStore';
import { hitungStage } from '../../utils/statusShipmentCalc';
import { Ship, Clock, AlertTriangle, AlertOctagon, Activity, Box, Map, DollarSign, CheckCircle, FileText, Check, MessageSquare, X } from 'lucide-react';
import { getUserName } from '../../utils/userLookup';
import TaskFormModal from '../../components/TaskFormModal';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

const ManagerImportReport = () => {
  const navigate = useNavigate();
  const { shipments } = useImportOperationalStore();
  const { jobOrders } = usePaymentStore();
  const { tasks } = useTaskStore();
  const { user, getStaffByDept, getAllUsers } = useAuthStore();
  const { getComputedReports, respondToReport, toggleReviewReport } = useReportStore();

  const [responseInputs, setResponseInputs] = useState({});
  const [pipelineModal, setPipelineModal] = useState(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // --- SECTION 1: Operasional ---
  const activeShipments = useMemo(() => shipments.filter(s => hitungStage(s, jobOrders) !== 'Status Complete'), [shipments, jobOrders]);
  
  const totalShipmentAktif = activeShipments.length;

  const avgDurasi = useMemo(() => {
    let totalDur = 0;
    let count = 0;
    activeShipments.forEach(s => {
      s.containers?.forEach(c => {
        if (c.durasioBongkar) {
          totalDur += Number(c.durasioBongkar);
          count++;
        }
      });
    });
    return count > 0 ? (totalDur / count).toFixed(1) : 0;
  }, [activeShipments]);

  const dndCharges = useMemo(() => {
    return jobOrders
      .filter(jo => jo.costType === "LINE (Extend DO / Demdet)" || jo.cost_type === "LINE (Extend DO / Demdet)")
      .reduce((sum, jo) => sum + (Number(jo.remainingBalance || jo.remaining_balance) || 0), 0);
  }, [jobOrders]);

  const clearanceTertunda = useMemo(() => {
    return activeShipments.filter(s => 
      s.containers?.some(c => c.fishIssue || c.queueIssue || c.spaceIssue || c.otherIssue)
    ).length;
  }, [activeShipments]);

  // --- SECTION 2: Kinerja Tim ---
  const deptStaff = getStaffByDept('Import');
  const importSupervisors = useMemo(() => {
    return getAllUsers().filter(u => u.level_otoritas === 'Supervisor' && u.departemen === 'Import');
  }, [getAllUsers]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  const staffPerformance = useMemo(() => {
    return deptStaff.map(staff => {
      const staffTasks = tasks.filter(t => t.department === 'Import' && t.assigneeId === staff.id);
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
        completionRate,
        status_aktif: staff.status_aktif
      };
    });
  }, [tasks, deptStaff, currentYear, today]);

  const supervisorPerformance = useMemo(() => {
    return importSupervisors.map(spv => {
      const spvTasks = tasks.filter(t => t.department === 'Import' && t.assigneeId === spv.id);
      const active = spvTasks.filter(t => t.status !== 'Selesai');
      const done = spvTasks.filter(t => t.status === 'Selesai');
      
      let overdue = 0;
      active.forEach(t => {
        if (t.dueDate) {
          const due = new Date(`${t.dueDate} ${currentYear}`);
          if (due < today) overdue++;
        }
      });

      const completionRate = spvTasks.length === 0 ? 0 : Math.round((done.length / spvTasks.length) * 100);

      return {
        id: spv.id,
        name: spv.name,
        total: spvTasks.length,
        active: active.length,
        done: done.length,
        overdue,
        completionRate,
        status_aktif: spv.status_aktif
      };
    });
  }, [tasks, importSupervisors, currentYear, today]);

  // --- SECTION 3-6: Status Shipment ---
  const stagesCount = useMemo(() => {
    const counts = {
      'Shipment Active': 0,
      'Delivery Active': 0,
      'Financial Settlement': 0,
      'Status Complete': 0
    };
    shipments.forEach(s => {
      const stage = hitungStage(s, jobOrders) || 'Shipment Active';
      if (counts[stage] !== undefined) {
        counts[stage]++;
      }
    });
    return counts;
  }, [shipments, jobOrders]);

  // --- SECTION 7: Forum Laporan ---
  const importReports = getComputedReports().filter(r => r.departemen === 'Import');

  const handleSendResponse = (reportId) => {
    const text = responseInputs[reportId];
    if (text && text.trim()) {
      respondToReport(reportId, text, user?.name || 'Top Management');
      setResponseInputs(prev => ({ ...prev, [reportId]: '' }));
    }
  };

  const handleToggleReview = (reportId) => {
    toggleReviewReport(reportId);
  };

  return (
    <div style={{ backgroundColor: 'var(--color-canvas-parchment)', minHeight: '100%', padding: 'var(--spacing-xl)', fontFamily: 'var(--font-family-body)', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: '34px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 8px 0', letterSpacing: '-0.374px' }}>
          Laporan Departemen Import
        </h1>
        <p style={{ fontSize: '17px', color: 'var(--color-ink-muted-80)', margin: '0', lineHeight: '1.47' }}>
          Pengawasan Eksekutif untuk Operasional, Kinerja Tim, Status Shipment, & Eskalasi Isu
        </p>
      </div>

      <div style={{ flex: 1 }}>
        
        {/* SECTION 1: Operasional KPI */}
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '21px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={20} color="var(--color-primary)" />
            1. Metrik Operasional (Import Operational)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-lg)' }}>
            
            <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Shipment Aktif</div>
              <div style={{ fontSize: '34px', fontWeight: '600', color: 'var(--color-ink)', lineHeight: '1', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {totalShipmentAktif} <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', fontWeight: '400' }}>Shipments</span>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rata-rata Durasi Bongkar</div>
              <div style={{ fontSize: '34px', fontWeight: '600', color: 'var(--color-ink)', lineHeight: '1', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {avgDurasi} <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', fontWeight: '400' }}>Jam</span>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DND Charges Outstanding</div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: dndCharges > 0 ? 'var(--color-status-danger)' : 'var(--color-status-success)', lineHeight: '1' }}>
                  {formatRupiah(dndCharges)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '8px' }}>Biaya Demurrage/Detention yang belum lunas</div>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clearance Tertunda</div>
              <div>
                <div style={{ fontSize: '34px', fontWeight: '600', color: clearanceTertunda > 0 ? 'var(--color-status-danger)' : 'var(--color-ink)', lineHeight: '1', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  {clearanceTertunda} <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', fontWeight: '400' }}>Shipments</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '8px' }}>Memiliki isu antrian/pemeriksaan</div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2 & 3-6 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
          
          {/* SECTION 2 */}
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--color-primary)" />
              <h3 style={{ margin: '0', fontSize: '17px', fontWeight: '600', color: 'var(--color-ink)' }}>2. Kinerja Tim (Peta Tugas)</h3>
            </div>
            
            {/* SPV TABLE */}
            <div style={{ padding: '16px 24px', backgroundColor: 'var(--color-canvas-parchment)', fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-hairline)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Kinerja Supervisor
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase' }}>Nama Supervisor</th>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase' }}>Aktif</th>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase' }}>Selesai</th>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase' }}>Overdue</th>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase' }}>Completion</th>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisorPerformance.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-ink-muted-48)', textAlign: 'center' }}>Tidak ada data Supervisor</td></tr>
                  ) : supervisorPerformance.map((spv, idx) => (
                    <tr key={idx} style={{ borderBottom: idx !== supervisorPerformance.length - 1 ? '1px solid var(--color-hairline)' : 'none' }}>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{spv.name} {spv.status_aktif === false && <span style={{marginLeft:'4px', fontSize:'10px', padding:'2px 4px', backgroundColor:'#fee2e2', color:'#ef4444', borderRadius:'4px'}}>Nonaktif</span>}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>{spv.active}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: 'var(--color-status-success)' }}>{spv.done}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: spv.overdue > 0 ? 'var(--color-status-danger)' : 'var(--color-ink-muted-48)' }}>
                        {spv.overdue}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '100px', height: '8px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-pill)', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                borderRadius: 'var(--rounded-pill)', 
                                backgroundColor: spv.completionRate === 100 ? 'var(--color-status-success)' : 'var(--color-primary)',
                                width: `${spv.completionRate}%` 
                              }} 
                            />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', width: '30px' }}>{spv.completionRate}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button 
                          onClick={() => { setSelectedAssignee(spv.id); setIsAssignModalOpen(true); }}
                          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: '6px 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* STAFF TABLE */}
            <div style={{ padding: '16px 24px', backgroundColor: 'var(--color-canvas-parchment)', fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-hairline)', borderTop: '1px solid var(--color-hairline)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Kinerja Staff
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase' }}>Nama Staff</th>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase' }}>Aktif</th>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase' }}>Selesai</th>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase' }}>Overdue</th>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', width: '25%' }}>Completion</th>
                    <th style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--color-hairline)', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {staffPerformance.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-ink-muted-48)', textAlign: 'center' }}>Tidak ada data Staff</td></tr>
                  ) : staffPerformance.map((staff, idx) => (
                    <tr key={idx} style={{ borderBottom: idx !== staffPerformance.length - 1 ? '1px solid var(--color-hairline)' : 'none' }}>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{staff.name} {staff.status_aktif === false && <span style={{marginLeft:'4px', fontSize:'10px', padding:'2px 4px', backgroundColor:'#fee2e2', color:'#ef4444', borderRadius:'4px'}}>Nonaktif</span>}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>{staff.active}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: 'var(--color-status-success)' }}>{staff.done}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: staff.overdue > 0 ? 'var(--color-status-danger)' : 'var(--color-ink-muted-48)' }}>
                        {staff.overdue}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
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
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', width: '30px' }}>{staff.completionRate}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3-6 */}
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Map size={18} color="var(--color-primary)" />
              <h3 style={{ margin: '0', fontSize: '17px', fontWeight: '600', color: 'var(--color-ink)' }}>3-6. Status Pipeline (Global)</h3>
            </div>
            <div style={{ padding: 'var(--spacing-lg)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flex: 1, alignContent: 'center' }}>
              {[
                { title: 'Shipment Active', icon: Ship, color: 'var(--color-primary)', bg: 'var(--color-status-info-bg)', count: stagesCount['Shipment Active'] },
                { title: 'Delivery Active', icon: Map, color: 'var(--color-status-warning)', bg: 'var(--color-status-warning-bg)', count: stagesCount['Delivery Active'] },
                { title: 'Financial Settlement', icon: DollarSign, color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', count: stagesCount['Financial Settlement'] },
                { title: 'Status Complete', icon: CheckCircle, color: 'var(--color-status-success)', bg: 'var(--color-status-success-bg)', count: stagesCount['Status Complete'] }
              ].map(stage => (
                <div 
                  key={stage.title}
                  onClick={() => setPipelineModal(stage.title)}
                  style={{ borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', backgroundColor: stage.bg, color: stage.color }}>
                    <stage.icon size={20} />
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '4px', lineHeight: '1' }}>{stage.count}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>{stage.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 7: Forum Pengumpulan Laporan */}
        <div>
          <h2 style={{ fontSize: '21px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} color="var(--color-primary)" />
            7. Forum Laporan SPV & Tanggapan
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {importReports.length === 0 ? (
              <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted-80)' }}>
                Belum ada laporan dari Supervisor Import.
              </div>
            ) : (
              importReports.map(report => {
                const type = report.report_type || report.tipe;
                let bg = 'var(--color-status-neutral-bg)', color = 'var(--color-ink-muted-80)';
                if (type === 'Weekday Report') { bg = 'var(--color-status-neutral-bg)'; color = 'var(--color-ink)'; }
                else if (type === 'Problem Report') { bg = 'var(--color-status-danger-bg)'; color = 'var(--color-status-danger)'; }
                else if (type === 'Progress Problem' || type === 'Progress Update') { bg = 'var(--color-status-warning-bg)'; color = 'var(--color-status-warning)'; }
                else if (type === 'Solve Update') { bg = 'var(--color-status-success-bg)'; color = 'var(--color-status-success)'; }

                const isProblem = type === 'Problem Report';

                return (
                  <div key={report.id} style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden' }}>
                    {/* Report Header & Content */}
                    <div style={{ padding: 'var(--spacing-lg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ backgroundColor: bg, color: color, padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', fontWeight: '600' }}>
                            {type}
                          </span>
                          {isProblem && report.status && (
                            <span style={{ padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', fontWeight: '600', backgroundColor: report.status === 'Open' ? 'var(--color-status-danger-bg)' : 'var(--color-status-success-bg)', color: report.status === 'Open' ? 'var(--color-status-danger)' : 'var(--color-status-success)' }}>
                              {report.status}
                            </span>
                          )}
                          {report.tanggapan_manager && (
                            <span style={{ backgroundColor: 'var(--color-status-info-bg)', color: 'var(--color-status-info)', padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '12px', fontWeight: '600' }}>
                              Ditanggapi
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>
                          {new Date(report.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <h4 style={{ fontSize: '21px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 8px 0', lineHeight: '1.24' }}>
                        {report.judul}
                      </h4>
                      <p style={{ fontSize: '17px', color: 'var(--color-ink-muted-80)', margin: '0 0 16px 0', lineHeight: '1.47' }}>
                        {report.isi}
                      </p>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', fontWeight: '600', textTransform: 'uppercase' }}>
                        Dilaporkan oleh: <span style={{ color: 'var(--color-ink)' }}>{getUserName(report.dibuatOlehId)}</span>
                      </div>
                    </div>

                    {/* Manager Interaction Area */}
                    <div style={{ backgroundColor: 'var(--color-canvas-parchment)', borderTop: '1px solid var(--color-hairline)', padding: 'var(--spacing-lg)' }}>
                      
                      {/* Review Toggle for Problem Reports */}
                      {isProblem && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-hairline)' }}>
                          <button 
                            onClick={() => handleToggleReview(report.id)}
                            style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${report.ditinjau_manager ? 'var(--color-primary)' : 'var(--color-hairline)'}`, backgroundColor: report.ditinjau_manager ? 'var(--color-primary)' : 'var(--color-canvas)', cursor: 'pointer', padding: 0 }}
                          >
                            <Check size={14} color={report.ditinjau_manager ? '#fff' : 'transparent'} strokeWidth={3} />
                          </button>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: report.ditinjau_manager ? 'var(--color-ink)' : 'var(--color-ink-muted-80)' }}>
                            Tandai Sudah Ditinjau (Acknowledge)
                          </span>
                        </div>
                      )}

                      {/* Response Area */}
                      {report.tanggapan_manager ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                              Tanggapan Anda ({report.ditanggapi_oleh})
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>
                              {new Date(report.tanggapan_pada).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)', padding: '16px', fontSize: '14px', color: 'var(--color-ink)', lineHeight: '1.43', marginBottom: '12px' }}>
                            {report.tanggapan_manager}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => {
                                setResponseInputs(prev => ({ ...prev, [report.id]: report.tanggapan_manager }));
                                respondToReport(report.id, null, null);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '14px', cursor: 'pointer', padding: 0 }}
                            >
                              Edit Tanggapan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)', textTransform: 'uppercase', marginBottom: '8px' }}>Berikan Tanggapan / Arahan</label>
                          <textarea 
                            rows={3}
                            value={responseInputs[report.id] || ''}
                            onChange={(e) => setResponseInputs(prev => ({ ...prev, [report.id]: e.target.value }))}
                            placeholder="Ketik tanggapan Anda di sini..."
                            style={{ width: '100%', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)', padding: '12px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '16px', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleSendResponse(report.id)}
                              disabled={!responseInputs[report.id]?.trim()}
                              style={{ 
                                backgroundColor: responseInputs[report.id]?.trim() ? 'var(--color-primary)' : 'var(--color-canvas-parchment)', 
                                color: responseInputs[report.id]?.trim() ? 'var(--color-on-primary)' : 'var(--color-ink-muted-48)', 
                                border: 'none', 
                                borderRadius: 'var(--rounded-pill)', 
                                padding: '11px 22px', 
                                fontSize: '14px', 
                                cursor: responseInputs[report.id]?.trim() ? 'pointer' : 'not-allowed' 
                              }}
                            >
                              Kirim Tanggapan
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* MODAL STATUS PIPELINE */}
      {pipelineModal && (
        <div style={{ position: 'fixed', inset: '0', zIndex: 50, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', padding: '24px' }} onClick={() => setPipelineModal(null)}>
          <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '100%', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '21px', fontWeight: '600', color: 'var(--color-ink)', margin: '0' }}>
                Shipments: {pipelineModal}
              </h2>
              <button onClick={() => setPipelineModal(null)} style={{ background: 'none', border: 'none', color: 'var(--color-ink-muted-48)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '60vh' }}>
              {shipments.filter(s => (hitungStage(s, jobOrders) || 'Shipment Active') === pipelineModal).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-ink-muted-48)', padding: '32px 0' }}>
                  Tidak ada shipment pada tahap ini.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {shipments.filter(s => (hitungStage(s, jobOrders) || 'Shipment Active') === pipelineModal).map(s => (
                    <div key={s.id} onClick={() => { setPipelineModal(null); navigate('/workspace/status-shipment'); }} style={{ backgroundColor: 'var(--color-canvas-parchment)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{s.id}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{s.supplier}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Kontainer</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{s.containers?.length || 0}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '24px', borderTop: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setPipelineModal(null)}
                style={{ backgroundColor: 'var(--color-canvas)', color: 'var(--color-primary)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-pill)', padding: '11px 22px', fontSize: '14px', cursor: 'pointer' }}
              >
                Tutup
              </button>
              <button 
                onClick={() => { setPipelineModal(null); navigate('/workspace/status-shipment'); }}
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--rounded-pill)', padding: '11px 22px', fontSize: '14px', cursor: 'pointer' }}
              >
                Lihat Detail Penuh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH TUGAS (ASSIGN) */}
      <TaskFormModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        defaultDepartment="Import"
        defaultAssignee={selectedAssignee}
      />
    </div>
  );
};

export default ManagerImportReport;
