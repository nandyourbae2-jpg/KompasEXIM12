import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Box, DollarSign, Clock, AlertCircle, ChevronDown, 
  FileText, Download, Bell, RefreshCw, Calendar, X,
  TrendingUp, Ship, ClipboardList, Activity
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import useReportStore from '../../store/useReportStore';
import useTaskStore from '../../store/useTaskStore';
import useImportOperationalStore from '../../store/useImportOperationalStore';
import usePaymentStore from '../../store/usePaymentStore';
import { calcTotals } from '../../utils/importCalc';
import { getUserName } from '../../utils/userLookup';

// Helpers
const fmtRupiah = (val) => {
  const n = Number(val) || 0;
  return `Rp ${(n / 1000000).toFixed(2).replace('.', ',')} M`;
};

const ManagerHome = () => {
  const navigate = useNavigate();
  const { getComputedReports, reports: allReports } = useReportStore();
  const { tasks } = useTaskStore();
  const { shipments } = useImportOperationalStore();
  const { jobOrders, getKpiStats, fetchJobOrders } = usePaymentStore();

  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [costFilter, setCostFilter] = useState('YTD');
  const [showCostDropdown, setShowCostDropdown] = useState(false);
  const [kpiModal, setKpiModal] = useState(null);
  const [activityFilter, setActivityFilter] = useState('Semua Departemen');
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [trendFilter, setTrendFilter] = useState('7 Hari Terakhir');
  const [showTrendDropdown, setShowTrendDropdown] = useState(false);
  const [healthFilter, setHealthFilter] = useState('Import');
  const [showHealthDropdown, setShowHealthDropdown] = useState(false);
  useEffect(() => {
    if (jobOrders.length === 0) {
      fetchJobOrders().catch(() => {});
    }
  }, [jobOrders.length, fetchJobOrders]);

  // --- DATA EXTRACTION ---
  
  // 1. Reports & Alerts
  const computedReports = getComputedReports();
  const openProblemReports = computedReports.filter(r => (r.tipe === 'Problem Report' || r.report_type === 'Problem Report') && r.status === 'Open');
  const recentReports = [...allReports].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).slice(0, 4);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  // 2. Tasks KPIs
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(t => t.status !== 'Selesai');
  const overdueTasks = activeTasks.filter(t => t.dueDate && new Date(`${t.dueDate} ${currentYear}`) < today);

  // 3. Shipment KPIs
  const activeShipments = shipments.filter(s => s.status !== 'Selesai');
  
  // 4. Cost Monitoring (YTD) from jobOrders (Monitoring Pembayaran)
  const costData = useMemo(() => {
    let trucking = 0;
    let freight = 0;
    let pib = 0;
    let depo = 0;
    let lolo = 0;

    const filteredJOs = costFilter === 'Bulan Ini' 
      ? jobOrders.filter(jo => {
          const date = new Date(jo.dueDate || Date.now());
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
      : jobOrders;

    filteredJOs.forEach(jo => {
      const ct = (jo.costType || '').toUpperCase();
      const val = jo.totalInvoice || 0;

      if (ct.includes('TRUC')) trucking += val;
      else if (ct.includes('LINE')) freight += val;
      else if (ct.includes('PIB') || ct.includes('CUSTOMS') || ct.includes('PERIZINAN')) pib += val;
      else if (ct.includes('DEPO')) depo += val;
      else if (ct.includes('LOLO')) lolo += val;
      else pib += val; // Default other to Customs & PIB
    });

    const total = trucking + freight + pib + depo + lolo;
    
    return {
      data: [
        { name: 'Freight & Line', value: freight, color: '#0066cc' },
        { name: 'Customs & PIB', value: pib, color: '#818cf8' },
        { name: 'Trucking', value: trucking, color: '#38bdf8' },
        { name: 'Depo & Storage', value: depo, color: '#a78bfa' },
        { name: 'Lolo & Reimb', value: lolo, color: '#fbbf24' },
      ].filter(d => d.value > 0),
      total
    };
  }, [jobOrders, costFilter]);

  // 5. Operational Performance (Task Completion Trend)
  const taskCompletionTrend = useMemo(() => {
    let numDays = 7;
    if (trendFilter === '1 Bulan Terakhir') numDays = 30;
    else if (trendFilter === '3 Bulan Terakhir') numDays = 90;
    else if (trendFilter === '6 Bulan Terakhir') numDays = 180;
    else if (trendFilter === '1 Tahun Terakhir') numDays = 365;

    const today = new Date();
    const days = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      let label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (numDays > 90) {
        label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
      }

      days.push({ 
        dateStr: d.toISOString().split('T')[0],
        label,
        completed: 0 
      });
    }

    tasks.forEach(t => {
      if (t.status === 'Selesai' && t.statusHistory) {
        const selesaiEvent = t.statusHistory.find(h => h.status === 'Selesai');
        if (selesaiEvent) {
          const evDate = selesaiEvent.timestamp.split('T')[0];
          const dayMatch = days.find(d => d.dateStr === evDate);
          if (dayMatch) dayMatch.completed += 1;
        }
      }
    });
    return days;
  }, [tasks, trendFilter]);

  // 6. Shipment by Status (Replacing Vendor Score)
  const shipmentStatusData = useMemo(() => {
    const counts = {};
    shipments.forEach(s => {
      const st = s.status || 'Draft';
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);
  }, [shipments]);

  // 7. Department Health
  const deptHealth = useMemo(() => {
    const depts = ['Import', 'Export', 'Administrasi Export (AE)', 'Account Officer'];
    return depts.map(d => {
      let icon = Box;
      if (d === 'Import') icon = Ship;
      if (d === 'Administrasi Export (AE)') icon = ClipboardList;
      if (d === 'Account Officer') icon = DollarSign;

      const deptTasks = tasks.filter(t => t.department === d);
      if (deptTasks.length === 0) {
        return { 
          title: d, 
          score: '100%', 
          status: 'Sangat Baik', 
          color: '#34c759', 
          icon, 
          reason: 'Belum ada tugas operasional berjalan untuk departemen ini. Skor kesehatan secara otomatis dinilai 100% sempurna.'
        };
      }
      
      const deptOverdue = deptTasks.filter(t => new Date(`${t.dueDate} ${currentYear}`) < today && t.status !== 'Selesai').length;
      const scoreNum = Math.max(0, 100 - (deptOverdue / deptTasks.length * 100));
      
      let status = 'Sangat Baik';
      let color = '#34c759'; // green
      if (scoreNum < 70) { status = 'Perlu Perhatian'; color = '#ff9f0a'; }
      if (scoreNum < 40) { status = 'Kritis'; color = '#ff3b30'; }

      return { 
        title: d, 
        score: `${Math.round(scoreNum)}%`, 
        status, 
        color, 
        icon,
        reason: `Dihitung berdasarkan rasio penyelesaian tugas tepat waktu. Terdapat ${deptOverdue} tugas yang melewati tenggat waktu (overdue) dari total ${deptTasks.length} beban tugas operasional aktif.`
      };
    });
  }, [tasks]);

  // 8. Recent Activity (Replacing Shipment Timeline)
  const recentActivities = useMemo(() => {
    let allHistory = [];
    tasks.forEach(t => {
      if (t.statusHistory) {
        if (activityFilter === 'Semua Departemen' || t.department === activityFilter) {
          t.statusHistory.forEach(h => {
            allHistory.push({ ...h, taskTitle: t.title, dept: t.department });
          });
        }
      }
    });
    return allHistory.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
  }, [tasks, activityFilter]);

  // 9. Financial Settlement
  const paymentStats = getKpiStats();

  // --- UI HELPERS ---
  const getAlertColor = (idx) => {
    const colors = ['var(--color-status-danger)', 'var(--color-status-warning)', 'var(--color-status-danger)', 'var(--color-status-success)'];
    return colors[idx % colors.length];
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '8px 12px', boxShadow: 'var(--shadow)' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>{label}</p>
          <p style={{ margin: '0', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600' }}>
            {payload[0].name === 'completed' ? 'Selesai: ' : ''}{payload[0].value}
          </p>
        </div>
      );
    }
    return null;
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
            Ringkasan eksekutif berbasis data operasional riil.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-pill)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} <Calendar size={14} color="var(--color-ink-muted-48)" />
          </div>
          <button style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-full)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted-80)', cursor: 'pointer' }}>
            <RefreshCw size={16} />
          </button>
          <button style={{ position: 'relative', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-full)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted-80)', cursor: 'pointer' }}>
            <Bell size={16} />
            {openProblemReports.length > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--color-status-danger)', color: 'white', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: 'var(--rounded-pill)' }}>
                {openProblemReports.length}
              </span>
            )}
          </button>
          <button style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--rounded-sm)', padding: '9px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={14} /> Export Laporan
          </button>
        </div>
      </div>

      {/* TOP KPIs (REAL DATA) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'Total Shipment Aktif', value: activeShipments.length, trend: 'Aktif saat ini', icon: Package, color: 'var(--color-primary)', action: () => setKpiModal('shipments') },
          { title: 'Tugas Operasional Aktif', value: activeTasks.length, trend: `${totalTasks} total tugas`, icon: Box, color: 'var(--color-status-success)', action: () => setKpiModal('tasks') },
          { title: 'Isu Kritis (Open)', value: openProblemReports.length, trend: 'Perlu penanganan', icon: AlertCircle, color: 'var(--color-status-danger)', action: () => setShowAllAlerts(true) },
          { title: 'Tugas Overdue', value: overdueTasks.length, trend: 'Lewat tenggat', trendColor: 'var(--color-status-danger)', icon: Clock, color: 'var(--color-status-warning)', action: () => setKpiModal('overdue') },
        ].map((kpi, i) => (
          <div 
            key={i} 
            onClick={kpi.action}
            style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-hairline)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                <kpi.icon size={18} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>{kpi.title}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '8px', letterSpacing: '-0.5px' }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-48)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: kpi.trendColor || 'var(--color-ink-muted-80)' }}>{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MIDDLE GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px' }}>
        
        {/* Critical Alerts */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="var(--color-status-danger)" /> Critical Alerts
            </h3>
            <span style={{ backgroundColor: 'var(--color-status-danger-bg)', color: 'var(--color-status-danger)', padding: '2px 8px', borderRadius: 'var(--rounded-pill)', fontSize: '11px', fontWeight: '700' }}>
              {openProblemReports.length} Isu
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            {openProblemReports.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Tidak ada isu open.</div>
            ) : openProblemReports.slice(0,4).map((alert, i) => (
              <div key={alert.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getAlertColor(i), marginTop: '6px', flexShrink: 0 }} />
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <h4 style={{ margin: '0', fontSize: '12px', fontWeight: '700', color: 'var(--color-ink)' }}>{alert.judul}</h4>
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'var(--color-ink-muted-80)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{alert.isi}</p>
                  <span style={{ backgroundColor: 'var(--color-canvas-parchment)', color: 'var(--color-ink-muted-80)', padding: '2px 8px', borderRadius: 'var(--rounded-sm)', fontSize: '10px', fontWeight: '600' }}>{alert.departemen}</span>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setShowAllAlerts(true)}
            style={{ marginTop: '16px', width: '100%', backgroundColor: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'right' }}
          >
            Lihat Semua Alert →
          </button>
        </div>

        {/* Operational Performance (Task Completion Trend) */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>Task Completion Trend</h3>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowTrendDropdown(!showTrendDropdown)}
                style={{ backgroundColor: 'transparent', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                {trendFilter} <ChevronDown size={14} />
              </button>
              {showTrendDropdown && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', boxShadow: 'var(--shadow)', zIndex: 10, width: '150px', overflow: 'hidden' }}>
                  {['7 Hari Terakhir', '1 Bulan Terakhir', '3 Bulan Terakhir', '6 Bulan Terakhir', '1 Tahun Terakhir'].map(opt => (
                    <div 
                      key={opt}
                      onClick={() => { setTrendFilter(opt); setShowTrendDropdown(false); }}
                      style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', backgroundColor: trendFilter === opt ? 'var(--color-canvas-parchment)' : 'transparent', color: trendFilter === opt ? 'var(--color-primary)' : 'var(--color-ink)' }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <TrendingUp size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>Penyelesaian Tugas per Hari</span>
              </div>
              <div style={{ flex: 1, minHeight: '120px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={taskCompletionTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-muted-48)' }} dy={10} minTickGap={30} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-muted-48)' }} dx={-10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="completed" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-primary)' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Shipment by Status */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>Shipment by Status</h3>
            <button onClick={() => navigate('/workspace/manager/import')} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
              Lihat →
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ fontSize: '10px', fontWeight: '600', color: 'var(--color-ink-muted-48)', paddingBottom: '12px' }}>Status</th>
                <th style={{ fontSize: '10px', fontWeight: '600', color: 'var(--color-ink-muted-48)', paddingBottom: '12px', textAlign: 'right' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {shipmentStatusData.length === 0 ? (
                 <tr><td colSpan={2} style={{ padding: '12px 0', fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Belum ada data</td></tr>
              ) : shipmentStatusData.map((v, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--color-hairline)' }}>
                  <td style={{ padding: '12px 0', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={10} color="var(--color-primary)" />
                    </div>
                    {v.name}
                  </td>
                  <td style={{ padding: '12px 0', fontSize: '12px', fontWeight: '700', color: 'var(--color-ink)', textAlign: 'right' }}>{v.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* BOTTOM GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px' }}>
        
        {/* Cost Monitoring (REAL) */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>Cost Monitoring ({costFilter})</h3>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowCostDropdown(!showCostDropdown)}
                style={{ backgroundColor: 'transparent', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                {costFilter} <ChevronDown size={14} />
              </button>
              {showCostDropdown && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', boxShadow: 'var(--shadow)', zIndex: 10, width: '100px', overflow: 'hidden' }}>
                  {['YTD', 'Bulan Ini'].map(opt => (
                    <div 
                      key={opt}
                      onClick={() => { setCostFilter(opt); setShowCostDropdown(false); }}
                      style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', backgroundColor: costFilter === opt ? 'var(--color-canvas-parchment)' : 'transparent', color: costFilter === opt ? 'var(--color-primary)' : 'var(--color-ink)' }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {costData.total === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Belum ada data biaya.</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              <div style={{ width: '120px', height: '120px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={costData.data} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                      {costData.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-ink-muted-48)', fontWeight: '600' }}>Total</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-ink)' }}>{fmtRupiah(costData.total)}</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {costData.data.map(item => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--color-ink-muted-80)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                    </div>
                    <span style={{ color: 'var(--color-ink)', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '8px' }}>{fmtRupiah(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Department Health (REAL) */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>Department Health</h3>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowHealthDropdown(!showHealthDropdown)}
                style={{ backgroundColor: 'transparent', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '4px 12px', fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-80)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                {healthFilter} <ChevronDown size={14} />
              </button>
              {showHealthDropdown && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', boxShadow: 'var(--shadow)', zIndex: 10, width: '150px', overflow: 'hidden' }}>
                  {deptHealth.map(dept => (
                    <div 
                      key={dept.title}
                      onClick={() => { setHealthFilter(dept.title); setShowHealthDropdown(false); }}
                      style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', backgroundColor: healthFilter === dept.title ? 'var(--color-canvas-parchment)' : 'transparent', color: healthFilter === dept.title ? 'var(--color-primary)' : 'var(--color-ink)' }}
                    >
                      {dept.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {(() => {
            const selectedDept = deptHealth.find(d => d.title === healthFilter) || deptHealth[0];
            const SelectedIcon = selectedDept.icon;
            return (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedDept.color, flexShrink: 0 }}>
                  <SelectedIcon size={32} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-ink)', lineHeight: '1', letterSpacing: '-0.5px' }}>{selectedDept.score}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted-80)', marginTop: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: selectedDept.color }} />
                    {selectedDept.status}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '16px', lineHeight: '1.6', padding: '12px 16px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)' }}>
                    <strong style={{ color: 'var(--color-ink)', display: 'block', marginBottom: '4px' }}>Dasar Pengukuran:</strong>
                    {selectedDept.reason}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Recent Activity (REAL) */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>Aktivitas Terkini</h3>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                style={{ backgroundColor: 'transparent', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '4px 12px', fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-80)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                {activityFilter === 'Semua Departemen' ? 'Semua Dept' : activityFilter} <ChevronDown size={14} />
              </button>
              {showActivityDropdown && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', boxShadow: 'var(--shadow)', zIndex: 10, width: '150px', overflow: 'hidden' }}>
                  {['Semua Departemen', 'Import', 'Export', 'Administrasi Export', 'Account Officer'].map(opt => (
                    <div 
                      key={opt}
                      onClick={() => { setActivityFilter(opt); setShowActivityDropdown(false); }}
                      style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', backgroundColor: activityFilter === opt ? 'var(--color-canvas-parchment)' : 'transparent', color: activityFilter === opt ? 'var(--color-primary)' : 'var(--color-ink)' }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            {recentActivities.length === 0 ? (
               <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Belum ada aktivitas.</div>
            ) : (
              <>
                <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '46px', width: '2px', backgroundColor: 'var(--color-hairline)', zIndex: 0 }} />
                {recentActivities.map((event, i) => {
                  const d = new Date(event.timestamp);
                  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                  let dotColor = '#38bdf8';
                  if (event.status === 'Selesai') dotColor = 'var(--color-status-success)';
                  if (event.status === 'Review') dotColor = '#fbbf24';
                  
                  return (
                    <div key={i} style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: '36px', fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-80)', marginTop: '2px' }}>{timeStr}</div>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dotColor, marginTop: '4px', border: '2px solid var(--color-canvas)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.label}</div>
                        <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--color-ink-muted-48)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.taskTitle}</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

      </div>

      {/* FINANCIAL SETTLEMENT */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>Financial Settlement (IDR)</h3>
          <div style={{ border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '4px 12px', fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-80)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Data dari Monitoring Pembayaran
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', marginBottom: '8px' }}>Total Tagihan (Invoice)</span>
            <span style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-ink)' }}>{fmtRupiah(paymentStats.IDR.totalInvoice)}</span>
          </div>
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', marginBottom: '8px' }}>Sudah Dibayar (Paid)</span>
            <span style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-status-success)' }}>{fmtRupiah(paymentStats.IDR.totalPaid)}</span>
          </div>
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', marginBottom: '8px' }}>Sisa Belum Dibayar (Outstanding)</span>
            <span style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-status-danger)' }}>{fmtRupiah(paymentStats.IDR.remainingBalance)}</span>
          </div>
        </div>
      </div>

      {/* LAPORAN TERBARU */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>Laporan Terbaru</h3>
          <button onClick={() => navigate('/workspace/manager/import')} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
            Lihat Semua →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {recentReports.length === 0 ? (
             <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Belum ada laporan masuk.</div>
          ) : recentReports.map((rep, i) => (
            <div key={rep.id} style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                  <FileText size={16} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '700', color: 'var(--color-ink)', lineHeight: '1.4' }}>{rep.judul}</h4>
                  <p style={{ margin: '0', fontSize: '10px', color: 'var(--color-ink-muted-80)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rep.isi}</p>
                </div>
              </div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--color-ink-muted-48)' }}>
                {new Date(rep.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {getUserName(rep.dibuatOlehId)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ALL ALERTS MODAL */}
      {showAllAlerts && (
        <div style={{ position: 'fixed', inset: '0', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', padding: '24px' }} onClick={() => setShowAllAlerts(false)}>
          <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--color-ink)', margin: '0' }}>Semua Critical Alerts</h2>
              <button onClick={() => setShowAllAlerts(false)} style={{ background: 'none', border: 'none', color: 'var(--color-ink-muted-48)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {openProblemReports.length === 0 ? <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>Tidak ada isu open.</p> : null}
              {openProblemReports.map((alert, idx) => (
                <div key={alert.id} style={{ display: 'flex', gap: '16px', borderBottom: idx !== openProblemReports.length - 1 ? '1px solid var(--color-hairline)' : 'none', paddingBottom: idx !== openProblemReports.length - 1 ? '16px' : '0' }}>
                   <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>{alert.judul}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{alert.isi}</p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>
                      <span>Dept: <b style={{color: 'var(--color-ink)'}}>{alert.departemen}</b></span>
                      <span>Oleh: <b style={{color: 'var(--color-ink)'}}>{getUserName(alert.dibuatOlehId)}</b></span>
                      <span>Tanggal: <b style={{color: 'var(--color-ink)'}}>{new Date(alert.tanggal).toLocaleDateString('id-ID')}</b></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI MODALS */}
      {kpiModal && (
        <div style={{ position: 'fixed', inset: '0', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', padding: '24px' }} onClick={() => setKpiModal(null)}>
          <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--color-ink)', margin: '0' }}>
                {kpiModal === 'shipments' ? 'Detail Shipment Aktif' : kpiModal === 'tasks' ? 'Detail Tugas Aktif' : 'Detail Tugas Overdue'}
              </h2>
              <button onClick={() => setKpiModal(null)} style={{ background: 'none', border: 'none', color: 'var(--color-ink-muted-48)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {kpiModal === 'shipments' && activeShipments.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--color-hairline)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>{s.un || s.id}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '4px' }}>{s.supplier || 'Unknown Supplier'} • {s.kat}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-bg)', padding: '4px 10px', borderRadius: 'var(--rounded-pill)' }}>{s.status || 'Aktif'}</div>
                  </div>
                </div>
              ))}
              {(kpiModal === 'tasks' || kpiModal === 'overdue') && (kpiModal === 'tasks' ? activeTasks : overdueTasks).map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--color-hairline)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>{t.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '4px' }}>{t.department} • Oleh: <span style={{ color: 'var(--color-ink)' }}>{getUserName(t.assigneeId)}</span></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-ink-muted-80)' }}>{t.status}</div>
                    <div style={{ fontSize: '11px', color: kpiModal === 'overdue' ? 'var(--color-status-danger)' : 'var(--color-ink-muted-48)', fontWeight: '600', backgroundColor: kpiModal === 'overdue' ? 'var(--color-status-danger-bg)' : 'var(--color-canvas-parchment)', padding: '2px 8px', borderRadius: 'var(--rounded-sm)' }}>
                      Tenggat: {t.dueDate || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerHome;
