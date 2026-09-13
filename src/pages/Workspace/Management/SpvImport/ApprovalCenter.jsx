import React, { useEffect } from 'react';
import ManagementWorkspace from '../../../../components/ManagementWorkspace';
import usePibRequestStore from '../../../../store/usePibRequestStore';
import useFinancialRequestStore from '../../../../store/useFinancialRequestStore';
import { CheckSquare, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { api } from '../../../../lib/api';
import { useAppleModal } from '../../../../contexts/AppleModalContext';

const ApprovalCenter = () => {
  const fetchPendingPib = usePibRequestStore(state => state.fetchPending);
  const pendingPib = usePibRequestStore(state => state.pendingApproval);
  const fetchPendingFin = useFinancialRequestStore(state => state.fetchPending);
  const pendingFin = useFinancialRequestStore(state => state.pendingApproval);
  const { alert } = useAppleModal();

  const [processingId, setProcessingId] = React.useState(null);

  useEffect(() => {
    fetchPendingPib();
    fetchPendingFin();
  }, [fetchPendingPib, fetchPendingFin]);

  const handleAction = async (item, action) => {
    try {
      setProcessingId(item.id);
      const endpoint = item.type === 'PIB Request' ? 'pib-requests' : 'financial-requests';
      await api(`/${endpoint}/${item.id}/${action}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: item.version })
      });
      
      // Refresh
      if (item.type === 'PIB Request') fetchPendingPib();
      else fetchPendingFin();
      
      // Notify other tabs
      const channel = new BroadcastChannel('exim_sync_channel');
      channel.postMessage({ type: 'DATA_UPDATED' });
      channel.close();
    } catch (err) {
      await alert(`Gagal memproses persetujuan: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Aggregate pending approvals
  const allPending = [
    ...pendingPib.map(p => ({
      id: p.id,
      version: p.version,
      type: 'PIB Request',
      reference: p.importProject?.bill_of_lading_no || p.import_project_id,
      amount: '-',
      status: p.status,
      date: p.created_at
    })),
    ...pendingFin.map(f => ({
      id: f.id,
      version: f.version,
      type: 'Financial Request',
      reference: f.request_number,
      amount: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(f.estimasi_nominal || 0),
      status: f.status,
      date: f.created_at
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <ManagementWorkspace
      title="Approval Center"
      subtitle="Semua permohonan persetujuan (PIB, Financial) yang membutuhkan tindakan Anda."
      summaryCards={[
        { label: 'Total Pending', value: allPending.length.toString(), trend: 'Requires action', trendColor: '#ff9500', icon: <Clock size={20} /> },
        { label: 'PIB Requests', value: pendingPib.length.toString(), trendColor: '#0066cc', icon: <CheckSquare size={20} /> },
        { label: 'Financial Requests', value: pendingFin.length.toString(), trendColor: '#ff3b30', icon: <CheckSquare size={20} /> }
      ]}
      tableConfig={{
        headers: ['Type', 'Reference No.', 'Amount', 'Date Submitted', 'Aksi'],
        data: allPending,
        renderRow: (item, idx) => (
          <tr key={`${item.type}-${item.id}`} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
            <td style={{ padding: '14px 24px', fontWeight: '600' }}>{item.type}</td>
            <td style={{ padding: '14px 24px', color: 'var(--color-ink-muted-80)' }}>{item.reference}</td>
            <td style={{ padding: '14px 24px', fontWeight: '600' }}>{item.amount}</td>
            <td style={{ padding: '14px 24px', color: 'var(--color-ink-muted-80)' }}>{new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style={{ padding: '14px 24px', display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => handleAction(item, 'approve')}
                disabled={processingId === item.id}
                style={{ backgroundColor: '#e7f8ec', color: '#34c759', border: '1px solid #34c759', padding: '6px 12px', borderRadius: 'var(--rounded-md)', fontSize: '12px', fontWeight: '600', cursor: processingId === item.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <CheckCircle size={14} /> {processingId === item.id ? 'Loading...' : 'Approve'}
              </button>
              <button 
                onClick={() => handleAction(item, 'reject')}
                disabled={processingId === item.id}
                style={{ backgroundColor: '#fff', color: '#f44336', border: '1px solid #f44336', padding: '6px 12px', borderRadius: 'var(--rounded-md)', fontSize: '12px', fontWeight: '600', cursor: processingId === item.id ? 'not-allowed' : 'pointer' }}
              >
                Reject
              </button>
            </td>
          </tr>
        )
      }}
      actionPanel={
        <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Approval Guidelines</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#e5f1fc', color: '#0066cc', borderRadius: 'var(--rounded-md)', fontSize: '13px', display: 'flex', gap: '8px' }}>
              <AlertCircle size={16} /> Pastikan mengecek draft PIB secara teliti sebelum menekan Approve.
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fafafa', borderRadius: 'var(--rounded-md)', fontSize: '13px', display: 'flex', gap: '8px' }}>
              <AlertCircle size={16} color="var(--color-ink-muted-48)" /> Financial Request &gt; Rp 100 Juta memerlukan review khusus.
            </div>
          </div>
        </div>
      }
    />
  );
};

export default ApprovalCenter;
