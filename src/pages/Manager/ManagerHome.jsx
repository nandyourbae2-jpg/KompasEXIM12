import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Box, DollarSign, Clock, AlertCircle, 
  FileText, Bell, RefreshCw, Calendar, 
  Ship, ClipboardList, Activity, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { api } from '../../lib/api';
import useReportStore from '../../store/useReportStore';
import useDebitNoteStore from '../../store/useDebitNoteStore';
import useMtbStore from '../../store/useMtbStore';
import { useAppleModal } from '../../contexts/AppleModalContext';

const fmtRupiah = (val) => {
  const n = Number(val) || 0;
  return `IDR ${new Intl.NumberFormat('id-ID').format(n)}`;
};

const ManagerHome = () => {
  const navigate = useNavigate();
  const { getComputedReports, fetchReports } = useReportStore();
  const { debitNotes, fetchDebitNotes } = useDebitNoteStore();
  const { periodes, fetchPeriodes } = useMtbStore();
  const { alert } = useAppleModal();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [selectedMtb, setSelectedMtb] = useState(null);
  const [selectedDn, setSelectedDn] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    api('/manager/dashboard')
      .then(data => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Gagal memuat dashboard');
        setLoading(false);
      });
  };

  const resolveProblem = async (id) => {
    try {
      setResolving(true);
      await api(`/reports/${id}/tinjau`, { method: 'PATCH' });
      setSelectedProblem(null);
      fetchReports(); 
    } catch (err) {
      console.error(err);
      await alert('Gagal menandai laporan sebagai selesai.');
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    fetchDebitNotes();
    fetchPeriodes();
    if (fetchReports) fetchReports();
    fetchDashboard();
  }, []);

  const computedReports = getComputedReports ? getComputedReports() : [];
  const openProblemReports = computedReports.filter(r => (r.tipe === 'Problem Report' || r.report_type === 'Problem Report') && r.status === 'Open');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stagnantDNs = useMemo(() => {
    return (debitNotes || []).filter(dn => {
      if (dn.status !== 'Diterbitkan' && dn.status !== 'Diakui') return false;
      const dnDate = new Date(dn.tanggal_dn);
      const diffTime = Math.abs(today - dnDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays > 30;
    });
  }, [debitNotes, today]);

  const pendingMtb = (Array.isArray(periodes) ? periodes : []).filter(p => p.status === 'Checked3' || p.status === 'Checked1' || p.status === 'Submitted');

  // Hardcode departments to ensure they always show up
  const departments = [
    { id: 'Import', name: 'Import Department', icon: Ship, route: '/workspace/manager/import' },
    { id: 'Export', name: 'Export Department', icon: Package, route: '/workspace/export' },
    { id: 'AO', name: 'AO Department', icon: DollarSign, route: '/workspace/ao' },
    { id: 'AE', name: 'AE Department', icon: ClipboardList, route: '/workspace/ae' },
  ];

  const getMatrixData = (deptId) => {
    const defaultData = { active_tasks: 0, overdue_tasks: 0 };
    if (!dashboardData?.tasks?.matrix) return defaultData;
    const found = dashboardData.tasks.matrix.find(m => m.departemen === deptId);
    return found || defaultData;
  };

  const getHealthStatus = (active, overdue) => {
    if (active === 0) return { label: 'Sedang Kosong', color: 'var(--color-ink-muted-48)', icon: Activity };
    const ratio = overdue / active;
    if (ratio === 0) return { label: 'Sangat Optimal', color: 'var(--color-status-success)', icon: ShieldCheck };
    if (ratio < 0.3) return { label: 'Perlu Perhatian', color: 'var(--color-status-warning)', icon: AlertTriangle };
    return { label: 'Sangat Kritis', color: 'var(--color-status-danger)', icon: AlertCircle };
  };

  return (
    <div style={{ backgroundColor: 'var(--color-canvas-parchment)', minHeight: '100%', padding: 'var(--spacing-xl)', fontFamily: 'var(--font-family-body)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: '28px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 8px 0', letterSpacing: '-0.374px' }}>
            Dasbor Top Management
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', margin: '0', fontWeight: '600' }}>
            Pusat Kendali Eksekutif — Pemantauan Seluruh Divisi
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-pill)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} <Calendar size={14} color="var(--color-ink-muted-48)" />
          </div>
          <button onClick={fetchDashboard} style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-full)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted-80)', cursor: 'pointer' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">{error}</h3>
          </div>
        </div>
      )}

      {/* TOP KPIs (GLOBAL) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'Total Pengiriman Aktif', value: dashboardData?.shipments?.active_count || 0, trend: 'Seluruh Divisi', icon: Ship, color: 'var(--color-primary)' },
          { title: 'Tugas Terlambat (Overdue)', value: dashboardData?.tasks?.overdue || 0, trend: 'Perlu Perhatian', icon: Clock, color: 'var(--color-status-danger)' },
          { title: 'Total Tagihan Belum Lunas', value: fmtRupiah(dashboardData?.financial?.payment?.outstanding || 0), trend: 'Buku Kas Terhutang', icon: DollarSign, color: 'var(--color-status-warning)' },
          { title: 'Isu Kritis Terbuka', value: dashboardData?.tasks?.eskalasi || 0, trend: 'Eskalasi Belum Selesai', icon: AlertCircle, color: 'var(--color-status-danger)' },
        ].map((kpi, i) => (
          <div 
            key={i} 
            style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                <kpi.icon size={18} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>{kpi.title}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '8px', letterSpacing: '-0.5px' }}>{kpi.value}</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-48)' }}>
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* DEPARTMENT HEALTH MATRIX */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)' }}>Status Kinerja Departemen</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {departments.map((dept) => {
              const data = getMatrixData(dept.id);
              const health = getHealthStatus(data.active_tasks, data.overdue_tasks);
              const Icon = dept.icon;
              const HealthIcon = health.icon;

              return (
                <div key={dept.id} onClick={() => navigate(dept.route)} style={{ border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-hairline)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted-80)' }}>
                        <Icon size={16} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{dept.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: `${health.color}15`, padding: '4px 8px', borderRadius: 'var(--rounded-pill)' }}>
                      <HealthIcon size={12} color={health.color} />
                      <span style={{ fontSize: '11px', fontWeight: '700', color: health.color }}>{health.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-ink)' }}>{data.active_tasks}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-48)' }}>Tugas Aktif</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: data.overdue_tasks > 0 ? 'var(--color-status-danger)' : 'var(--color-ink)' }}>{data.overdue_tasks}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-48)' }}>Tugas Terlambat</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ESCALATION CENTER */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} color="var(--color-status-danger)" /> Pusat Eskalasi Masalah
            </h3>
            <span style={{ backgroundColor: 'var(--color-status-danger-bg)', color: 'var(--color-status-danger)', padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '11px', fontWeight: '700' }}>
              {openProblemReports.length + stagnantDNs.length + pendingMtb.length} Masalah
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            {openProblemReports.length === 0 && stagnantDNs.length === 0 && pendingMtb.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Tidak ada isu aktif di lintas departemen.</div>
            ) : (
              <>
                {pendingMtb.slice(0, 3).map(mtb => (
                  <div key={`mtb-${mtb.id}`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706', marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ cursor: 'pointer' }} onClick={() => setSelectedMtb(mtb)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <h4 style={{ margin: '0', fontSize: '12px', fontWeight: '700', color: '#D97706' }}>Approval MTB: {mtb.nama_periode}</h4>
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'var(--color-ink-muted-80)', lineHeight: '1.4' }}>
                        Terdapat periode buku kas {mtb.nama_periode} yang menunggu persetujuan (approval) Anda.
                      </p>
                      <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 'var(--rounded-sm)', fontSize: '10px', fontWeight: '600' }}>Finance Dept</span>
                    </div>
                  </div>
                ))}
                {openProblemReports.slice(0, 3).map((alert) => (
                  <div key={alert.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-status-danger)', marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ cursor: 'pointer' }} onClick={() => setSelectedProblem(alert)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <h4 style={{ margin: '0', fontSize: '12px', fontWeight: '700', color: 'var(--color-ink)' }}>{alert.judul}</h4>
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'var(--color-ink-muted-80)', lineHeight: '1.4' }}>{alert.isi}</p>
                      <span style={{ backgroundColor: 'var(--color-canvas-parchment)', color: 'var(--color-ink-muted-80)', padding: '2px 8px', borderRadius: 'var(--rounded-sm)', fontSize: '10px', fontWeight: '600' }}>{alert.departemen}</span>
                    </div>
                  </div>
                ))}
                {stagnantDNs.slice(0, 3).map(dn => (
                  <div key={`dn-${dn.id}`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-status-danger)', marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ cursor: 'pointer' }} onClick={() => setSelectedDn(dn)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <h4 style={{ margin: '0', fontSize: '12px', fontWeight: '700', color: 'var(--color-status-danger)' }}>Debit Note Stagnan: {dn.dn_number}</h4>
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'var(--color-ink-muted-80)', lineHeight: '1.4' }}>
                        Klaim kepada <strong>{dn.claim_kepada}</strong> sebesar {fmtRupiah(dn.jumlah_klaim)} sudah lebih dari 30 hari.
                      </p>
                      <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '2px 8px', borderRadius: 'var(--rounded-sm)', fontSize: '10px', fontWeight: '600' }}>Finance Dept</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* PROBLEM REVIEW MODAL */}
      {selectedProblem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--color-canvas)', width: '500px', borderRadius: 'var(--rounded-lg)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)' }}>{selectedProblem.judul}</h2>
              <button 
                onClick={() => setSelectedProblem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-ink-muted-80)' }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Tipe Laporan</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{selectedProblem.tipe}</span>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Tanggal</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{selectedProblem.tanggal}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '8px' }}>Isi Laporan</span>
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--rounded-md)', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {selectedProblem.isi}
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setSelectedProblem(null)}
                disabled={resolving}
                style={{ padding: '8px 16px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', cursor: 'pointer', fontWeight: '600' }}
              >
                Tutup
              </button>
              <button 
                onClick={() => resolveProblem(selectedProblem.id)}
                disabled={resolving}
                style={{ padding: '8px 16px', backgroundColor: 'var(--color-status-success)', color: 'white', border: 'none', borderRadius: 'var(--rounded-md)', cursor: 'pointer', fontWeight: '600', opacity: resolving ? 0.7 : 1 }}
              >
                {resolving ? 'Menyelesaikan...' : 'Tandai Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MTB REVIEW MODAL */}
      {selectedMtb && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--color-canvas)', width: '500px', borderRadius: 'var(--rounded-lg)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)' }}>Preview: {selectedMtb.nama_periode}</h2>
              <button onClick={() => setSelectedMtb(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-ink-muted-80)' }}>&times;</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Status Saat Ini</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#D97706', backgroundColor: '#FEF3C7', padding: '4px 8px', borderRadius: 'var(--rounded-sm)' }}>
                  Menunggu Approval Manager
                </span>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Deskripsi</span>
                <span style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  Terdapat buku kas untuk periode <strong>{selectedMtb.nama_periode}</strong> yang telah diperiksa oleh Supervisor dan kini membutuhkan persetujuan final dari Anda selaku Manager sebelum dapat direalisasikan.
                </span>
              </div>
            </div>
            <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setSelectedMtb(null)}
                style={{ padding: '8px 16px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', cursor: 'pointer', fontWeight: '600' }}
              >
                Tutup Preview
              </button>
              <button 
                onClick={() => navigate('/workspace/realisasi-dana')}
                style={{ padding: '8px 16px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--rounded-md)', cursor: 'pointer', fontWeight: '600' }}
              >
                Buka Halaman Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEBIT NOTE REVIEW MODAL */}
      {selectedDn && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--color-canvas)', width: '500px', borderRadius: 'var(--rounded-lg)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--color-status-danger)' }}>Preview: {selectedDn.dn_number}</h2>
              <button onClick={() => setSelectedDn(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-ink-muted-80)' }}>&times;</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Diklaim Kepada</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{selectedDn.claim_kepada}</span>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Jumlah Klaim</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-status-danger)' }}>{fmtRupiah(selectedDn.jumlah_klaim)}</span>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Status Saat Ini</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#B91C1C', backgroundColor: '#FEE2E2', padding: '4px 8px', borderRadius: 'var(--rounded-sm)' }}>
                  Lebih dari 30 Hari (Stagnan)
                </span>
              </div>
            </div>
            <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setSelectedDn(null)}
                style={{ padding: '8px 16px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', cursor: 'pointer', fontWeight: '600' }}
              >
                Tutup Preview
              </button>
              <button 
                onClick={() => navigate('/workspace/debit-notes')}
                style={{ padding: '8px 16px', backgroundColor: 'var(--color-status-danger)', color: 'white', border: 'none', borderRadius: 'var(--rounded-md)', cursor: 'pointer', fontWeight: '600' }}
              >
                Buka Halaman Debit Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerHome;
