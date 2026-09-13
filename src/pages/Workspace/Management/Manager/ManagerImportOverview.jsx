import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../../lib/api';
import useMtbStore from '../../../../store/useMtbStore';
import { useAppleModal } from '../../../../contexts/AppleModalContext';
import { 
  DollarSign, 
  Truck, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  AlertOctagon,
  Clock,
  ShieldAlert,
  RefreshCw,
  Info,
  Package,
  Calendar,
  Users
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

const EmptyState = ({ message, subtitle }) => (
  <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', border: '1px dashed var(--color-hairline)' }}>
    <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{message}</p>
    {subtitle && <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{subtitle}</p>}
  </div>
);

const KPICard = ({ title, value, icon, subtitle, valueColor }) => (
  <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>{title}</span>
      <div style={{ color: 'var(--color-ink-muted-48)' }}>{icon}</div>
    </div>
    <div style={{ fontSize: '24px', fontWeight: '700', color: valueColor || 'var(--color-ink)' }}>{value}</div>
    {subtitle && <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '8px' }}>{subtitle}</div>}
  </div>
);

const ManagerImportOverview = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [resolving, setResolving] = useState(false);
  const { alert } = useAppleModal();

  const { periodes, fetchPeriodes } = useMtbStore();
  const pendingMtb = (Array.isArray(periodes) ? periodes : []).filter(p => p.status === 'Checked3' || p.status === 'Checked1' || p.status === 'Submitted');

  const [sortField, setSortField] = useState('spend');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api('/manager/import-control-tower');
      setData(res);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Unable to load Import Control Tower data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPeriodes();
  }, []);

  const resolveProblem = async (id) => {
    try {
      setResolving(true);
      await api(`/reports/${id}/tinjau`, { method: 'PATCH' });
      setSelectedProblem(null);
      fetchData();
    } catch (err) {
      console.error(err);
      await alert('Gagal menandai laporan sebagai selesai.');
    } finally {
      setResolving(false);
    }
  };

  const sortedVendors = useMemo(() => {
    if (!data || !data.trucking || !data.trucking.vendor_performance) return [];

    const vendorClaimCounts = {};
    if (data.trucking.claims && data.trucking.claims.details) {
      data.trucking.claims.details.forEach(c => {
        if (c.claim_vendor_name) {
          vendorClaimCounts[c.claim_vendor_name] = (vendorClaimCounts[c.claim_vendor_name] || 0) + 1;
        }
      });
    }

    const enrichedVendors = data.trucking.vendor_performance.map(v => {
      const claims = vendorClaimCounts[v.nama] || 0;
      const claimRate = v.job_orders > 0 ? (claims / v.job_orders) * 100 : 0;
      const spendShare = data.trucking.total_spend > 0 ? (v.spend / data.trucking.total_spend) * 100 : 0;
      let risk = 'Low';
      if (claimRate > 10 || spendShare > 50) risk = 'High';
      else if (claimRate > 0 || spendShare > 30) risk = 'Medium';

      return { ...v, claims, claimRate, spendShare, risk };
    });

    return [...enrichedVendors].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortOrder]);

  const scatterData = useMemo(() => {
    if (!data || !data.trucking || !data.trucking.vendor_performance) return [];
    
    const vendorClaimCounts = {};
    if (data.trucking.claims && data.trucking.claims.details) {
      data.trucking.claims.details.forEach(c => {
        if (c.claim_vendor_name) {
          vendorClaimCounts[c.claim_vendor_name] = (vendorClaimCounts[c.claim_vendor_name] || 0) + 1;
        }
      });
    }

    return data.trucking.vendor_performance.filter(v => v.job_orders > 0).map(v => {
      const claims = vendorClaimCounts[v.nama] || 0;
      const claimRate = (claims / v.job_orders) * 100;
      return {
        name: v.nama,
        Spend: v.spend,
        ClaimRate: claimRate,
        JobOrders: v.job_orders,
        Claims: claims
      };
    });
  }, [data]);

  const managementAttention = useMemo(() => {
    if (!data) return [];
    const alerts = [];
    
    if (data.tasks && data.tasks.overdue > 0) {
      alerts.push({ type: 'warning', message: data.tasks.overdue + " tasks are overdue." });
    }
    
    if (data.trucking && data.trucking.claims.active > 0) {
      alerts.push({ type: 'danger', message: data.trucking.claims.active + " active trucking claims require attention." });
    }
    
    if (data.trucking && data.trucking.fleet && data.trucking.fleet.expired_fleet > 0) {
      alerts.push({ type: 'warning', message: data.trucking.fleet.expired_fleet + " trucking fleets have expired compliance." });
    }
    
    if (data.financial && data.financial.outstanding_amount > 50000000) {
      alerts.push({ type: 'info', message: "Outstanding financial exposure is highly elevated (" + formatRupiah(data.financial.outstanding_amount) + ")." });
    }

    if (data.demurrage_risk) {
       const criticals = data.demurrage_risk.filter(d => d.risk_level === 'Critical').length;
       const warnings = data.demurrage_risk.filter(d => d.risk_level === 'Warning').length;
       if (criticals > 0) alerts.push({ type: 'danger', message: `${criticals} shipments have exceeded destination free time (Critical Demurrage Risk).` });
       if (warnings > 0) alerts.push({ type: 'warning', message: `${warnings} shipments are approaching free time limit (Demurrage Warning).` });
    }
    
    return alerts;
  }, [data]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-canvas-parchment)' }}>
        <p style={{ color: 'var(--color-ink-muted-80)', fontWeight: '600' }}>Loading Import Control Tower...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{ padding: '24px', backgroundColor: 'var(--color-status-danger-bg)', color: 'var(--color-status-danger)', borderRadius: 'var(--rounded-md)' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={18} /> {error}
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>Please check your connection or contact IT support.</p>
          <button 
            onClick={fetchData}
            style={{ padding: '8px 16px', backgroundColor: 'var(--color-status-danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', backgroundColor: 'var(--color-canvas-parchment)' }}>
      {/* 1. EXECUTIVE HEADER */}
      <div style={{ padding: '24px 32px', backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: 'var(--color-ink)' }}>Import Control Tower</h1>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>
              Executive view of import operations, shipment health, financial exposure, logistics performance, and operational risk.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <button 
              onClick={fetchData} 
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary)', border: 'none', borderRadius: 'var(--rounded-md)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600' }}
            >
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* 2. IMPORT EXECUTIVE KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <KPICard 
            title="Active Shipments" 
            value={data.shipments?.active || 'No Data'} 
            icon={<Package size={20} />} 
            subtitle="Shipments currently in progress"
          />
          <KPICard 
            title="Overdue Tasks" 
            value={data.tasks?.overdue || 0} 
            icon={<Clock size={20} />} 
            valueColor={data.tasks?.overdue > 0 ? 'var(--color-status-danger)' : 'var(--color-ink)'}
            subtitle="Requires immediate attention"
          />
          <KPICard 
            title="Financial Exposure" 
            value={data.financial?.total_exposure ? formatRupiah(data.financial.total_exposure) : 'Insufficient Data'} 
            icon={<DollarSign size={20} />} 
            subtitle="Total financial requests"
          />
          <KPICard 
            title="Critical Issues" 
            value={data.trucking?.claims?.active || 0} 
            icon={<AlertOctagon size={20} />} 
            valueColor={data.trucking?.claims?.active > 0 ? 'var(--color-status-danger)' : 'var(--color-ink)'}
            subtitle="Active claims & escalations"
          />
        </div>

        {/* 3. MANAGEMENT ATTENTION */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} /> Management Attention
            </h2>
          </div>
          <div style={{ padding: '20px' }}>
            {managementAttention.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {managementAttention.map((alert, idx) => (
                  <div key={idx} style={{ 
                    padding: '12px 16px', 
                    borderRadius: '4px', 
                    backgroundColor: alert.type === 'danger' ? 'var(--color-status-danger-bg)' : alert.type === 'warning' ? 'var(--color-status-warning-bg)' : 'var(--color-primary-bg)',
                    color: alert.type === 'danger' ? 'var(--color-status-danger)' : alert.type === 'warning' ? 'var(--color-status-warning-text)' : 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500'
                  }}>
                    <AlertTriangle size={16} /> {alert.message}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="All monitored areas are within current thresholds." subtitle="No critical escalations detected." />
            )}
          </div>
        </div>

        {/* APPROVAL & ESCALATION CENTER */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          
          {/* APPROVAL CENTER (IMPORT) */}
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="var(--color-status-success)" /> Approval Center
            </h2>
            <span style={{ backgroundColor: 'var(--color-status-warning-bg)', color: 'var(--color-status-warning-text)', padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '11px', fontWeight: '700' }}>
              {(data.approvals?.pib?.length || 0) + (data.approvals?.financial?.length || 0) + pendingMtb.length} Pending
            </span>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(!data.approvals?.pib?.length && !data.approvals?.financial?.length && pendingMtb.length === 0) ? (
              <EmptyState message="No pending approvals." subtitle="All requests have been processed." />
            ) : (
              <>
                {data.approvals?.pib?.map(p => (
                  <div key={`pib-${p.id}`} style={{ padding: '12px 16px', borderRadius: '4px', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '4px' }}>Customs PIB Request: {p.request_number || p.aju_pib}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>Amount: {formatRupiah(p.amount)}</div>
                    </div>
                    <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Waiting Manager</span>
                  </div>
                ))}
                {pendingMtb.map(mtb => (
                  <div key={`mtb-${mtb.id}`} style={{ padding: '12px 16px', borderRadius: '4px', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '4px' }}>MTB Realisasi Dana: {mtb.nama_periode}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>Status: Menunggu Approval Anda</div>
                    </div>
                    <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Waiting Manager</span>
                  </div>
                ))}
                {data.approvals?.financial?.map(f => (
                  <div key={`fin-${f.id}`} style={{ padding: '12px 16px', borderRadius: '4px', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '4px' }}>Financial Request: {f.request_number} ({f.type})</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>Amount: {formatRupiah(f.amount)}</div>
                    </div>
                    <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Waiting Manager</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* PROBLEM ESCALATION */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
           <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <AlertOctagon size={18} color="var(--color-status-danger)" /> Problem Escalation
             </h2>
             <span style={{ backgroundColor: 'var(--color-status-danger-bg)', color: 'var(--color-status-danger)', padding: '4px 10px', borderRadius: 'var(--rounded-pill)', fontSize: '11px', fontWeight: '700' }}>
               {data.problem_escalation?.length || 0} Unresolved
             </span>
           </div>
           <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
             {!data.problem_escalation?.length ? (
               <EmptyState message="No escalated problems." subtitle="Operational flow is normal." />
             ) : (
               data.problem_escalation.map(p => (
                 <div key={`prob-${p.id}`} style={{ padding: '12px 16px', borderRadius: '4px', backgroundColor: 'var(--color-status-danger-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '4px' }}>{p.judul}</div>
                     <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{p.tanggal} - {p.tipe}</div>
                   </div>
                   <button 
                     onClick={() => setSelectedProblem(p)}
                     style={{ backgroundColor: 'var(--color-status-danger)', border: 'none', cursor: 'pointer', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}
                   >
                     Review
                   </button>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>

        {/* 4, 5, & 6. SHIPMENT, OPERATIONAL CONTROL, TEAM PRODUCTIVITY */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '24px', marginBottom: '24px' }}>
          
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} /> Shipment Overview
              </h2>
            </div>
            <div style={{ padding: '20px', height: '250px' }}>
              {data.shipments?.total > 0 ? (
                <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Active', value: data.shipments.active },
                            { name: 'Completed', value: data.shipments.completed },
                            { name: 'Cancelled', value: data.shipments.cancelled }
                          ].filter(d => d.value > 0)}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="var(--color-primary)" />
                          <Cell fill="var(--color-status-success)" />
                          <Cell fill="var(--color-status-warning)" />
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--color-hairline)', paddingLeft: '16px' }}>
                    <h3 style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', margin: '0 0 12px 0' }}>Transport Modes</h3>
                    {data.transport_modes?.map(t => (
                      <div key={t.mode} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink)' }}>{t.mode}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>{t.count}</span>
                      </div>
                    ))}
                    {(!data.transport_modes || data.transport_modes.length === 0) && (
                      <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>No data</span>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState message="No shipment data available." />
              )}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} /> Operational Tasks Control
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>Status penyelesaian seluruh tugas operasional harian tim</span>
              </div>
            </div>
            <div style={{ padding: '20px', height: '250px' }}>
              {data.tasks?.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Completed', value: data.tasks.completed },
                    { name: 'Active', value: data.tasks.active },
                    { name: 'Overdue', value: data.tasks.overdue }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-ink-muted-48)', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-ink-muted-48)', fontSize: 12}} />
                    <RechartsTooltip cursor={{fill: 'var(--color-canvas-parchment)'}} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {
                        [
                          { name: 'Completed', value: data.tasks.completed },
                          { name: 'Active', value: data.tasks.active },
                          { name: 'Overdue', value: data.tasks.overdue }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Overdue' ? 'var(--color-status-danger)' : entry.name === 'Completed' ? 'var(--color-status-success)' : 'var(--color-primary)'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No operational tasks available." />
              )}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} /> Team Productivity
              </h2>
            </div>
            <div style={{ padding: '20px', flexGrow: 1 }}>
              {data.team_progress && data.team_progress.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {data.team_progress.map((tp, idx) => {
                     const pct = tp.total > 0 ? Math.round((tp.completed / tp.total) * 100) : 0;
                     return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{tp.role}</span>
                          <span style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>{tp.completed} / {tp.total} ({pct}%)</span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: 'var(--color-hairline)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, backgroundColor: 'var(--color-primary)', height: '100%' }} />
                        </div>
                      </div>
                     );
                  })}
                </div>
              ) : (
                <EmptyState message="No team tasks assigned yet." subtitle="Productivity metrics will appear here." />
              )}
            </div>
          </div>

        </div>

        {/* 6 & 7. DOCUMENT/CUSTOMS & FINANCIAL */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', display: 'flex', flexDirection: 'column' }}>
             <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} /> Document & Customs
              </h2>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1, maxHeight: '350px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--color-hairline)' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>Total Documents</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{data.documents?.total || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--color-hairline)' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>Pending Documents</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-status-warning)' }}>{data.documents?.pending || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--color-hairline)' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>PIB Clearance Total</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{data.customs?.total || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--color-hairline)' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>Pending Clearance</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-status-danger)' }}>{data.customs?.pending_clearance || 0}</span>
              </div>

              {/* PROJECT DOCUMENTS BREAKDOWN */}
              <div style={{ marginTop: '8px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted-80)', marginBottom: '12px' }}>Document Breakdown per Project</h3>
                {data.documents?.monitoringList && data.documents.monitoringList.length > 0 ? (
                  data.documents.monitoringList.map(project => {
                    const isComplete = project.doc_complete === project.doc_total && project.doc_total > 0;
                    const isStarted = project.doc_complete > 0;
                    const badgeColor = isComplete 
                      ? { bg: 'var(--color-status-success-bg)', text: 'var(--color-status-success)' }
                      : isStarted 
                        ? { bg: 'var(--color-status-warning-bg)', text: 'var(--color-status-warning)' }
                        : { bg: 'var(--color-status-danger-bg)', text: 'var(--color-status-danger)' };

                    return (
                      <div key={project.project_id} style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '4px' }}>{project.project_id}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{project.supplier}</div>
                        </div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px 10px',
                          borderRadius: 'var(--rounded-pill)',
                          backgroundColor: badgeColor.bg,
                          color: badgeColor.text,
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>
                          {project.doc_complete} / {project.doc_total} Complete
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>No active projects found.</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', display: 'flex', flexDirection: 'column' }}>
             <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} /> Financial & Cost
              </h2>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--color-hairline)' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>Total Import Cost</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{data.financial?.total_exposure ? formatRupiah(data.financial.total_exposure) : '0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--color-hairline)' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>Paid</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-status-success)' }}>{data.financial?.paid_amount ? formatRupiah(data.financial.paid_amount) : '0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>Outstanding</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-status-danger)' }}>{data.financial?.outstanding_amount ? formatRupiah(data.financial.outstanding_amount) : '0'}</span>
              </div>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-hairline)', margin: '16px 0' }} />
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Logistics & Trucking Intelligence</h2>

        {/* 8. TRUCKING KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <KPICard title="Trucking Spend" value={formatRupiah(data.trucking?.total_spend || 0)} icon={<DollarSign size={20} />} />
          <KPICard title="Trucking Job Orders" value={data.trucking?.job_orders || 0} icon={<Truck size={20} />} />
          <KPICard title="Active Trucking Vendors" value={data.trucking?.active_vendors || 0} icon={<CheckCircle size={20} />} />
          <KPICard title="Trucking Claims" value={data.trucking?.claims?.total || 0} icon={<AlertTriangle size={20} />} valueColor={data.trucking?.claims?.total > 0 ? 'var(--color-status-danger)' : 'var(--color-ink)'} />
        </div>

        {/* 9. COST VS RISK (SCATTER PLOT) */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)' }}>Cost vs Risk Analysis</h2>
          </div>
          <div style={{ padding: '20px', height: '300px' }}>
            {scatterData.length > 0 && scatterData.some(v => v.Claims > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
                  <XAxis type="number" dataKey="Spend" name="Total Spend" unit=" IDR" tickFormatter={(v) => (v/1000000).toFixed(0) + 'M'} tick={{fill: 'var(--color-ink-muted-48)', fontSize: 12}} />
                  <YAxis type="number" dataKey="ClaimRate" name="Claim Rate" unit="%" tick={{fill: 'var(--color-ink-muted-48)', fontSize: 12}} />
                  <ZAxis type="number" dataKey="JobOrders" range={[50, 400]} name="Job Orders" />
                  <RechartsTooltip cursor={{strokeDasharray: '3 3'}} formatter={(value, name) => name === 'Total Spend' ? formatRupiah(value) : value} />
                  <Scatter name="Vendors" data={scatterData} fill="var(--color-primary)" opacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Insufficient data for risk comparison." subtitle="Requires active vendors with claim history." />
            )}
          </div>
        </div>

        {/* 10. EXECUTIVE VENDOR TABLE */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)' }}>Executive Vendor Table</h2>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Sort by clicking column headers</div>
          </div>
          
          {sortedVendors.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-canvas-parchment)', color: 'var(--color-ink-muted-80)' }}>
                    <th style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--color-hairline)' }} onClick={() => handleSort('nama')}>Vendor {sortField==='nama' ? (sortOrder==='asc'?'↑':'↓'):''}</th>
                    <th style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--color-hairline)' }} onClick={() => handleSort('status')}>Status {sortField==='status' ? (sortOrder==='asc'?'↑':'↓'):''}</th>
                    <th style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--color-hairline)' }} onClick={() => handleSort('job_orders')}>Job Orders {sortField==='job_orders' ? (sortOrder==='asc'?'↑':'↓'):''}</th>
                    <th style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--color-hairline)' }} onClick={() => handleSort('spend')}>Total Spend {sortField==='spend' ? (sortOrder==='asc'?'↑':'↓'):''}</th>
                    <th style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--color-hairline)' }} onClick={() => handleSort('spendShare')}>Spend Share {sortField==='spendShare' ? (sortOrder==='asc'?'↑':'↓'):''}</th>
                    <th style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--color-hairline)' }} onClick={() => handleSort('claimRate')}>Claim Rate {sortField==='claimRate' ? (sortOrder==='asc'?'↑':'↓'):''}</th>
                    <th style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--color-hairline)' }} onClick={() => handleSort('risk')}>Risk {sortField==='risk' ? (sortOrder==='asc'?'↑':'↓'):''}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVendors.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                      <td style={{ padding: '12px 20px', fontWeight: '500' }}>{v.nama}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                          backgroundColor: v.status === 'Aktif' ? 'var(--color-status-success-bg)' : 'var(--color-ink-muted-10)',
                          color: v.status === 'Aktif' ? 'var(--color-status-success)' : 'var(--color-ink-muted-80)'
                        }}>
                          {v.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px' }}>{v.job_orders}</td>
                      <td style={{ padding: '12px 20px' }}>{formatRupiah(v.spend)}</td>
                      <td style={{ padding: '12px 20px' }}>{v.spendShare.toFixed(1)}%</td>
                      <td style={{ padding: '12px 20px' }}>{v.claimRate.toFixed(1)}%</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{
                          fontWeight: '600',
                          color: v.risk === 'High' ? 'var(--color-status-danger)' : v.risk === 'Medium' ? 'var(--color-status-warning)' : 'var(--color-status-success)'
                        }}>
                          {v.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px' }}>
               <EmptyState message="No vendor data available." />
            </div>
          )}
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
    </div>
  );
};

export default ManagerImportOverview;
