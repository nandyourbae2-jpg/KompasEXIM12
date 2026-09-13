import React, { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Briefcase, 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  RefreshCw,
  Clock,
  PieChart as PieChartIcon,
  Shield,
  Lightbulb,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  BarChart2,
  Target
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  AreaChart, Area, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

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

const ManagerStrategicAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [costData, setCostData] = useState(null);
  const [vendorData, setVendorData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, costRes, vendorRes] = await Promise.all([
        api('/manager/strategic-analytics'),
        api('/manager/cost-variance'),
        api('/manager/vendor-analytics')
      ]);
      setData(res);
      setCostData(costRes);
      setVendorData(vendorRes);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Unable to load Strategic Analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-canvas-parchment)' }}>
        <p style={{ color: 'var(--color-ink-muted-80)', fontWeight: '600' }}>Loading Strategic Analytics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{ padding: '24px', backgroundColor: 'var(--color-status-danger-bg)', color: 'var(--color-status-danger)', borderRadius: 'var(--rounded-md)' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> {error}
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

  const fin = data.financial_exposure;
  const op = data.operational_trend;
  const vs = data.vendor_strategy;

  // Management Insights Generation
  const insights = [];
  
  if (fin.outstanding_amount > fin.total_exposure * 0.3) {
    insights.push(`⚠️ High financial exposure: Outstanding payments represent ${((fin.outstanding_amount / fin.total_exposure) * 100).toFixed(1)}% of total exposure.`);
  } else if (fin.outstanding_amount > 0) {
    insights.push(`✅ Financial exposure is within normal limits. Paid: ${formatRupiah(fin.paid_amount)}.`);
  } else {
    insights.push('✅ No outstanding financial exposure currently recorded.');
  }

  if (costData?.summary) {
    const cv = costData.summary;
    if (cv.grand_variance > 0 && cv.grand_estimasi > 0) {
      const pct = ((cv.grand_variance / cv.grand_estimasi) * 100).toFixed(1);
      insights.push(`🔴 Cost Overrun Alert: Aktual melebihi estimasi sebesar ${formatRupiah(cv.grand_variance)} (+${pct}%). Terdapat ${cv.overrun_count} item yang over-budget.`);
    } else if (cv.grand_variance < 0) {
      insights.push(`✅ Biaya terkendali: Aktual ${formatRupiah(Math.abs(cv.grand_variance))} di bawah estimasi.`);
    }
  }

  if (op.active_shipments > 0) {
    insights.push(`🚢 Operations handling ${op.active_shipments} active shipments out of ${op.total_shipments} total volume.`);
  }

  if (vs.trucking_spend > 0) {
    insights.push(`🚛 Trucking spend stands at ${formatRupiah(vs.trucking_spend)} across ${vs.active_trucking_vendors} active vendors.`);
  }

  // Cost Variance Chart Data
  const costCategoryChart = (costData?.by_category || []).map(c => ({
    name: c.cost_category?.replace(/^Biaya\s*/i, '') || 'Other',
    estimasi: c.total_estimasi,
    aktual: c.total_actual,
    variance: c.total_actual - c.total_estimasi
  })).filter(c => c.estimasi > 0 || c.aktual > 0);

  // Vendor Strategy Matrix Data (Kraljic-style quadrant)
  const vendorMatrix = (vendorData?.vendor_performance || []).map(v => {
    const maxSpend = Math.max(...(vendorData?.vendor_performance || []).map(vv => vv.spend), 1);
    const spendScore = (v.spend / maxSpend) * 100;
    const performanceScore = v.job_orders > 0 ? Math.min(100, 40 + (v.job_orders * 10)) : 20;
    
    return {
      name: v.nama,
      spend: v.spend,
      spendScore,
      performanceScore,
      jobOrders: v.job_orders,
      status: v.status,
      quadrant: spendScore >= 50 
        ? (performanceScore >= 50 ? 'Strategic Partners' : 'Bottleneck')
        : (performanceScore >= 50 ? 'Leverage' : 'Non-Critical')
    };
  }).filter(v => v.spend > 0);

  const quadrantColors = {
    'Strategic Partners': '#059669',
    'Bottleneck': '#DC2626',
    'Leverage': '#2563EB',
    'Non-Critical': '#9CA3AF'
  };

  return (
    <div style={{ backgroundColor: 'var(--color-canvas-parchment)', minHeight: '100%', paddingBottom: '60px', fontFamily: 'var(--font-family-body)' }}>
      {/* HEADER */}
      <div style={{ padding: '32px 40px', backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', letterSpacing: '-0.5px' }}>Strategic Analytics</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>Executive insights for operational and financial decision making.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} /> Last Updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button 
            onClick={fetchData} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}
          >
            <RefreshCw size={14} /> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div style={{ padding: '0 40px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* MANAGEMENT INSIGHTS */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={18} color="var(--color-primary)" /> Management Insights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insights.map((insight, idx) => (
              <div key={idx} style={{ padding: '16px', backgroundColor: 'var(--color-canvas-parchment)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)', fontSize: '14px', color: 'var(--color-ink)' }}>
                {insight}
              </div>
            ))}
          </div>
        </div>

        {/* KPI CARDS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          
          {/* A. FINANCIAL EXPOSURE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial Exposure</h3>
            <KPICard 
              title="Total Exposure" 
              value={formatRupiah(fin.total_exposure)} 
              icon={<DollarSign size={18} />} 
              subtitle={`${fin.request_volume} financial requests`}
            />
            <KPICard 
              title="Outstanding Amount" 
              value={formatRupiah(fin.outstanding_amount)} 
              icon={<AlertCircle size={18} />} 
              valueColor={fin.outstanding_amount > 0 ? 'var(--color-status-danger)' : 'var(--color-ink)'}
            />
            <KPICard 
              title="Paid Amount" 
              value={formatRupiah(fin.paid_amount)} 
              icon={<CheckCircle size={18} />} 
              valueColor="var(--color-status-success)"
            />
          </div>

          {/* B. OPERATIONAL TREND */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Operational Trend</h3>
            <KPICard 
              title="Active Shipments" 
              value={op.active_shipments} 
              icon={<TrendingUp size={18} />} 
              subtitle={`Out of ${op.total_shipments} total shipments`}
            />
            <KPICard 
              title="Tasks Completed" 
              value={op.completed_tasks} 
              icon={<Activity size={18} />} 
              subtitle={`Out of ${op.total_tasks} total tasks`}
            />
            <KPICard 
              title="Task Completion Rate" 
              value={op.total_tasks > 0 ? `${((op.completed_tasks / op.total_tasks) * 100).toFixed(1)}%` : 'No Data'} 
              icon={<PieChartIcon size={18} />} 
            />
          </div>

          {/* C. VENDOR STRATEGY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vendor Strategy</h3>
            <KPICard 
              title="Trucking Spend" 
              value={formatRupiah(vs.trucking_spend)} 
              icon={<Briefcase size={18} />} 
            />
            <KPICard 
              title="Active Trucking Partners" 
              value={vs.active_trucking_vendors} 
              icon={<Shield size={18} />} 
            />
            <KPICard 
              title="Average Spend per Vendor" 
              value={vs.active_trucking_vendors > 0 ? formatRupiah(vs.trucking_spend / vs.active_trucking_vendors) : 'No Data'} 
              icon={<Activity size={18} />} 
            />
          </div>

        </div>

        {/* ═══════════ COST VARIANCE SECTION ═══════════ */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} color="var(--color-primary)" /> Cost Variance Analysis
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>
            Membandingkan biaya Estimasi vs Aktual per kategori biaya. Bar merah menandakan cost overrun.
          </p>

          {/* Variance Summary */}
          {costData?.summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted-48)', marginBottom: '4px' }}>Total Estimasi</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)' }}>{formatRupiah(costData.summary.grand_estimasi)}</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted-48)', marginBottom: '4px' }}>Total Aktual</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)' }}>{formatRupiah(costData.summary.grand_actual)}</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: costData.summary.grand_variance > 0 ? '#FEF2F2' : '#F0FDF4', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted-48)', marginBottom: '4px' }}>Variance</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: costData.summary.grand_variance > 0 ? '#DC2626' : '#059669' }}>
                  {costData.summary.grand_variance > 0 ? '+' : ''}{formatRupiah(costData.summary.grand_variance)}
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted-48)', marginBottom: '4px' }}>Over-Budget Items</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: costData.summary.overrun_count > 0 ? '#DC2626' : 'var(--color-ink)' }}>{costData.summary.overrun_count}</div>
              </div>
            </div>
          )}

          {/* Bar Chart: Estimasi vs Aktual per Category */}
          {costCategoryChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costCategoryChart} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-ink-muted-80)' }} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 11, fill: 'var(--color-ink-muted-80)' }} />
                <RechartsTooltip formatter={(value) => formatRupiah(value)} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-hairline)' }} />
                <Legend />
                <Bar dataKey="estimasi" name="Estimasi" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                <Bar dataKey="aktual" name="Aktual" fill="#34D399" radius={[4, 4, 0, 0]}>
                  {costCategoryChart.map((entry, idx) => (
                    <Cell key={idx} fill={entry.variance > 0 ? '#EF4444' : '#34D399'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted-48)', fontSize: '14px' }}>
              Belum ada data variance yang tersedia.
            </div>
          )}

          {/* Top Overruns Table */}
          {costData?.top_overruns?.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} color="#DC2626" /> Top Cost Overruns
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>Proyek</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>Kategori</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>Vendor</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>Estimasi</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>Aktual</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>Overrun</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.top_overruns.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-primary)' }}>{item.project_code}</td>
                      <td style={{ padding: '10px 12px' }}>{item.cost_category}</td>
                      <td style={{ padding: '10px 12px' }}>{item.vendor || '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatRupiah(item.estimasi)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{formatRupiah(item.aktual)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>
                        +{formatRupiah(item.variance)} <span style={{ fontSize: '10px', opacity: 0.7 }}>({item.variance_pct}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══════════ VENDOR STRATEGY MATRIX ═══════════ */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="var(--color-primary)" /> Vendor Strategy Matrix (Kraljic)
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>
            Pemetaan kuadran vendor berdasarkan Spend (sumbu Y) vs Performance/Activity (sumbu X). Membantu keputusan negosiasi kontrak.
          </p>

          {/* Quadrant Legend */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {Object.entries(quadrantColors).map(([q, c]) => (
              <div key={q} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: c }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c }} />
                {q}
              </div>
            ))}
          </div>

          {vendorMatrix.length > 0 ? (
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                <XAxis type="number" dataKey="performanceScore" name="Performance" domain={[0, 100]} 
                  label={{ value: 'Performance Score →', position: 'bottom', offset: 0, style: { fontSize: 11, fill: 'var(--color-ink-muted-80)' } }}
                  tick={{ fontSize: 11, fill: 'var(--color-ink-muted-80)' }} />
                <YAxis type="number" dataKey="spendScore" name="Spend" domain={[0, 100]} 
                  label={{ value: '← Spend Level', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--color-ink-muted-80)' } }}
                  tick={{ fontSize: 11, fill: 'var(--color-ink-muted-80)' }} />
                <ZAxis type="number" dataKey="jobOrders" range={[80, 400]} name="Job Orders" />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload?.length > 0) {
                      const d = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--color-ink)' }}>{d.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>
                            Spend: {formatRupiah(d.spend)}<br />
                            Job Orders: {d.jobOrders}<br />
                            <span style={{ fontWeight: 600, color: quadrantColors[d.quadrant] }}>Kuadran: {d.quadrant}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Reference lines at 50% */}
                <Scatter data={vendorMatrix} shape="circle">
                  {vendorMatrix.map((entry, index) => (
                    <Cell key={index} fill={quadrantColors[entry.quadrant]} fillOpacity={0.8} stroke={quadrantColors[entry.quadrant]} strokeWidth={1} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted-48)', fontSize: '14px' }}>
              Belum ada data vendor yang memadai untuk ditampilkan.
            </div>
          )}

          {/* Vendor Quadrant Table */}
          {vendorMatrix.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>Vendor</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>Total Spend</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>Job Orders</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>Kuadran</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorMatrix.sort((a, b) => b.spend - a.spend).map((v, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-ink)' }}>{v.name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatRupiah(v.spend)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{v.jobOrders}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 600,
                          backgroundColor: v.status === 'Aktif' ? '#D1FAE5' : '#F1F5F9',
                          color: v.status === 'Aktif' ? '#065F46' : '#475569'
                        }}>{v.status}</span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 600,
                          backgroundColor: quadrantColors[v.quadrant] + '20',
                          color: quadrantColors[v.quadrant]
                        }}>{v.quadrant}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ManagerStrategicAnalytics;
