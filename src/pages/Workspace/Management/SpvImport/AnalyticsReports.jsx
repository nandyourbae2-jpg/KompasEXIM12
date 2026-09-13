import React, { useEffect } from 'react';
import ManagementWorkspace from '../../../../components/ManagementWorkspace';
import { LoadingState } from '../../../../components/SPV/LoadingState';
import { ErrorState } from '../../../../components/SPV/ErrorState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, AlertTriangle, Users, FileText } from 'lucide-react';
import useSpvStore from '../../../../store/useSpvStore';
import { api } from '../../../../lib/api';

const AnalyticsReports = () => {
  const [analyticsData, setAnalyticsData] = React.useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = React.useState(true);
  const [errorAnalytics, setErrorAnalytics] = React.useState(null);

  useEffect(() => {
    api('/control-tower/analytics')
      .then(data => {
        setAnalyticsData(data);
        setLoadingAnalytics(false);
      })
      .catch(err => {
        setErrorAnalytics(err.message);
        setLoadingAnalytics(false);
      });
  }, []);

  if (loadingAnalytics) return <LoadingState message="Menghasilkan Laporan Analitik..." />;
  if (errorAnalytics) return <ErrorState message={errorAnalytics} onRetry={() => window.location.reload()} />;
  if (!analyticsData) return null;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF3B30'];

  return (
    <ManagementWorkspace
      title="Analytics & Reports"
      subtitle={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Laporan performa departemen, vendor, dan tren keterlambatan.</span>
        </div>
      }
      summaryCards={[
        { label: 'Avg Clearance Time', value: `${analyticsData.avgClearanceTime} Days`, trend: 'Real-time', trendColor: '#34c759', icon: <Clock size={20} /> },
        { label: 'Overall SLA Rate', value: `${analyticsData.slaRate}%`, trend: 'Real-time', trendColor: '#34c759', icon: <TrendingUp size={20} /> },
        { label: 'Total Delay Issues', value: analyticsData.totalDelayIssues.toString(), trend: 'Real-time', trendColor: '#ff9500', icon: <AlertTriangle size={20} /> },
      ]}
      actionPanel={
        <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Export Laporan</h3>
          <button style={{ width: '100%', padding: '12px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', marginBottom: '12px' }}>
            <FileText size={16} /> Download PDF
          </button>
          <button style={{ width: '100%', padding: '12px', backgroundColor: '#e7f8ec', color: '#2e7d32', border: '1px solid #2e7d32', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
            Export Excel
          </button>
        </div>
      }
      customContent={
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
          
          {/* Shipment Trend Chart */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-hairline)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Shipment Performance Trend</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={analyticsData.shipmentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#f5f5f5'}} />
                  <Bar dataKey="onTime" name="On Time" stackId="a" fill="#34c759" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="delayed" name="Delayed" stackId="a" fill="#ff3b30" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Delay Reasons Pie Chart */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-hairline)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Top Delay Reasons</h3>
            <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={analyticsData.delayReasons}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.delayReasons.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ paddingLeft: '16px' }}>
                {analyticsData.delayReasons.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px' }}>
                    <div style={{ width: 12, height: 12, backgroundColor: COLORS[index % COLORS.length], borderRadius: '2px' }} />
                    <span>{entry.name} ({entry.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vendor SLA Table */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-hairline)', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Vendor SLA Performance</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-hairline)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--color-ink-muted-48)', fontWeight: '600' }}>Vendor Name</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-ink-muted-48)', fontWeight: '600' }}>On-Time SLA Rate</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-ink-muted-48)', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.vendorSla.map((v, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '600' }}>{v.name}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '100px', height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${v.sla}%`, height: '100%', backgroundColor: v.sla > 90 ? '#34c759' : v.sla > 75 ? '#ff9500' : '#ff3b30' }} />
                        </div>
                        <span>{v.sla}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ color: v.sla > 90 ? '#34c759' : v.sla > 75 ? '#ff9500' : '#ff3b30', fontWeight: '600' }}>
                        {v.sla > 90 ? 'Excellent' : v.sla > 75 ? 'Warning' : 'Critical'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
      }
    />
  );
};

export default AnalyticsReports;
