import React from 'react';
import ManagementWorkspace from '../../../../components/ManagementWorkspace';
import { Truck, ShieldAlert, CheckCircle, ChevronRight } from 'lucide-react';
import useSPVData from '../../../../hooks/useSPVData';
import { StatusBadge } from '../../../../components/SPV/SPVSharedComponents';

const SpvVendorMonitoring = () => {
  const { data: rawVendors, loading, error } = useSPVData('/api/vendors');

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat Vendor Monitoring...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>;

  const vendors = (rawVendors || []).map(v => {
    const rate = v.rating ? Math.round((v.rating / 5) * 100) : 85;
    let st = 'Good';
    if (v.status === 'Tidak Aktif' || rate < 60) st = 'Critical';
    else if (rate < 80) st = 'Warning';

    return {
      id: v.id,
      name: v.nama || 'Unknown Vendor',
      serviceType: v.service_type || 'General',
      activeShipments: 0, // In a real app this would be a JOIN count
      slaOnTimeRate: rate,
      status: st
    };
  });

  const goodCount = vendors.filter(v => v.status === 'Good').length;
  const warningCount = vendors.filter(v => v.status === 'Warning').length;
  const criticalCount = vendors.filter(v => v.status === 'Critical').length;
  const avgSla = vendors.length > 0 
    ? (vendors.reduce((acc, curr) => acc + (curr.slaOnTimeRate || 0), 0) / vendors.length).toFixed(1) 
    : '0.0';

  return (
    <ManagementWorkspace
      title="Vendor Monitoring"
      subtitle={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Memantau performa, SLA, dan risiko keterlambatan dari seluruh Vendor.</span>
          <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '8px' }}>
            Data ini juga terlihat di Manager Dashboard → Laporan Departemen
          </span>
        </div>
      }
      summaryCards={[
        { label: 'Total Active Vendors', value: vendors.length.toString(), trend: 'Active', trendColor: '#0066cc', icon: <Truck size={20} /> },
        { label: 'Avg SLA On-Time', value: `${avgSla}%`, trend: 'Performance', trendColor: '#34c759', icon: <CheckCircle size={20} /> },
        { label: 'High Risk Vendors', value: (warningCount + criticalCount).toString(), trend: 'Needs Attention', trendColor: '#ff3b30', icon: <ShieldAlert size={20} /> }
      ]}
      tableConfig={{
        headers: ['Vendor Name', 'Service Category', 'SLA On-Time', 'Status', 'Aksi'],
        data: vendors,
        renderRow: (item, idx, onDetail) => (
          <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
            <td style={{ padding: '14px 24px', fontWeight: '600', color: 'var(--color-primary)' }}>{item.name}</td>
            <td style={{ padding: '14px 24px', color: 'var(--color-ink-muted-80)' }}>{item.serviceType}</td>
            <td style={{ padding: '14px 24px' }}>{item.slaOnTimeRate}%</td>
            <td style={{ padding: '14px 24px' }}>
              <span style={{ 
                backgroundColor: item.status === 'Good' ? '#e7f8ec' : item.status === 'Warning' ? '#fff2e0' : '#ffebee', 
                color: item.status === 'Good' ? '#34c759' : item.status === 'Warning' ? '#ff9500' : '#f44336', 
                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' 
              }}>
                {item.status}
              </span>
            </td>
            <td style={{ padding: '14px 24px' }}>
              <button onClick={() => onDetail && onDetail()} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center' }}>Detail <ChevronRight size={14} /></button>
            </td>
          </tr>
        )
      }}
      actionPanel={
        <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Vendor Alerts</h3>
          <div style={{ padding: '12px', color: 'var(--color-ink-muted-48)', fontSize: '13px' }}>
            {criticalCount > 0 ? `Terdapat ${criticalCount} vendor dengan status Kritis.` : 'Tidak ada isu kritis pada vendor.'}
          </div>
        </div>
      }
    />
  );
};

export default SpvVendorMonitoring;
