import React from 'react';
import ManagementWorkspace from '../../../../components/ManagementWorkspace';
import { DollarSign, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import useSPVData from '../../../../hooks/useSPVData';
import { KPICard, StatusBadge } from '../../../../components/SPV/SPVSharedComponents';

const SpvFinancialMonitoring = () => {
  const { data: jobOrders, loading, error } = useSPVData('/api/job-orders');

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat Financial Monitoring...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>;

  const summary = {
    total_invoice: (jobOrders || []).reduce((acc, curr) => acc + (curr.total_invoice || 0), 0),
    total_paid: (jobOrders || []).reduce((acc, curr) => acc + (curr.total_paid || 0), 0),
  };
  summary.outstanding = summary.total_invoice - summary.total_paid;

  return (
    <ManagementWorkspace
      title="Financial Monitoring"
      subtitle={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Pemantauan arus kas Import: dari Pengajuan Dana, Pembayaran, hingga Outstanding.</span>
          <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '8px' }}>
            Data ini juga terlihat di Manager Dashboard → Laporan Departemen
          </span>
        </div>
      }
      summaryCards={[
        { label: 'Total Invoice', value: `IDR ${new Intl.NumberFormat('id-ID').format(summary.total_invoice || 0)}`, trend: 'Billed', trendColor: '#0066cc', icon: <DollarSign size={20} /> },
        { label: 'Total Paid', value: `IDR ${new Intl.NumberFormat('id-ID').format(summary.total_paid || 0)}`, trend: 'Terealisasi', trendColor: '#34c759', icon: <Clock size={20} /> },
        { label: 'Outstanding', value: `IDR ${new Intl.NumberFormat('id-ID').format(summary.outstanding || 0)}`, trend: 'Belum Lunas', trendColor: '#ff9500', icon: <AlertCircle size={20} /> },
      ]}
      tableConfig={{
        headers: ['JO No.', 'Supplier', 'Amount', 'Date', 'Status', 'Aksi'],
        data: jobOrders || [],
        renderRow: (item, idx, onDetail) => (
          <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
            <td style={{ padding: '14px 24px', fontWeight: '600', color: 'var(--color-primary)' }}>{item.jo_number || `JO-${item.id}`}</td>
            <td style={{ padding: '14px 24px' }}>{item.supplier_name || '-'}</td>
            <td style={{ padding: '14px 24px', fontWeight: '600' }}>IDR {Number(item.total_invoice || 0).toLocaleString('id-ID')}</td>
            <td style={{ padding: '14px 24px', color: 'var(--color-ink-muted-80)' }}>{item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}</td>
            <td style={{ padding: '14px 24px' }}>
              <StatusBadge status={item.total_paid >= item.total_invoice ? 'Selesai' : 'Dalam Proses'} />
            </td>
            <td style={{ padding: '14px 24px' }}>
              <button onClick={() => onDetail && onDetail()} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center' }}>Detail <ChevronRight size={14} /></button>
            </td>
          </tr>
        )
      }}
      actionPanel={
        <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recovery Metrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>Outstanding Payment</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#ff9500' }}>IDR {new Intl.NumberFormat('id-ID').format(summary.outstanding || 0)}</div>
            </div>
          </div>
        </div>
      }
    />
  );
};

export default SpvFinancialMonitoring;
