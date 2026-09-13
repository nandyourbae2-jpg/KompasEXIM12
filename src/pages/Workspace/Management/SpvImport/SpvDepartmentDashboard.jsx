import React from 'react';
import ManagementWorkspace from '../../../../components/ManagementWorkspace';
import useAuthStore from '../../../../store/useAuthStore';
import useSPVData from '../../../../hooks/useSPVData';
import { Package, Ship, DollarSign, Activity, CheckSquare, Truck, Clock, AlertTriangle, FileText, Anchor, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SpvDepartmentDashboard = () => {
  const { user } = useAuthStore();
  const dept = user?.departemen;

  const { data: stats, loading: statsLoading, error: statsError } = useSPVData(`/api/control-tower/stats?departemen=${dept}`);
  const { data: perf, loading: perfLoading, error: perfError } = useSPVData(`/api/control-tower/staff-performance?departemen=${dept}`);

  if (statsLoading || perfLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat Executive Dashboard...</div>;
  if (statsError || perfError) return <div style={{ padding: '40px', color: 'red' }}>Error: {statsError || perfError}</div>;

  const chartData = [
    { name: 'Shipment Aktif', count: stats?.shipment_aktif || 0 },
    { name: 'Tugas Aktif', count: stats?.tugas_aktif || 0 },
    { name: 'Overdue Task', count: stats?.overdue || 0 },
    { name: 'Eskalasi', count: stats?.eskalasi || 0 },
    { name: 'Menunggu Approval', count: stats?.approval_waiting || 0 }
  ];

  return (
    <ManagementWorkspace
      title={`Executive Dashboard — ${dept}`}
      subtitle="Ringkasan eksekutif seluruh parameter operasional dan finansial. Data 100% tersinkronisasi realtime dengan staf."
      summaryCards={[
        { label: 'Total Staff', value: stats?.total_staff?.toString() || '0', trend: 'Active', trendColor: '#0066cc', icon: <CheckSquare size={20} /> },
        { label: 'Active Shipments', value: stats?.shipment_aktif?.toString() || '0', trend: 'In Progress', trendColor: '#0066cc', icon: <Ship size={20} /> },
        { label: 'Active Tasks', value: stats?.tugas_aktif?.toString() || '0', trend: 'Needs Action', trendColor: '#ff9500', icon: <Activity size={20} /> },
        { label: 'Overdue Tasks', value: stats?.overdue?.toString() || '0', trend: 'Critical', trendColor: '#ff3b30', icon: <Clock size={20} /> },
        { label: 'Approval Waiting', value: stats?.approval_waiting?.toString() || '0', trend: 'Need Review', trendColor: '#ff9500', icon: <FileText size={20} /> },
        { label: 'Escalations', value: stats?.eskalasi?.toString() || '0', trend: 'Attention', trendColor: '#ff3b30', icon: <AlertTriangle size={20} /> }
      ]}
      chartPanel={
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Control Tower Overview</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{fontSize: 12, fontWeight: 600, fill: 'var(--color-ink)'}} />
                  <Tooltip cursor={{fill: '#f5f5f5'}} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      }
      tableConfig={{
        headers: ['Nama Staff', 'Tugas Aktif', 'Selesai', 'Overdue', 'Completion', 'Aksi'],
        data: perf || [],
        renderRow: (p, idx, onDetail) => (
          <tr key={p.id || idx} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
            <td style={{ padding: '12px 24px', fontWeight: '600', color: 'var(--color-primary)' }}>{p.nama}</td>
            <td style={{ padding: '12px 24px' }}>{p.tugas_aktif}</td>
            <td style={{ padding: '12px 24px', color: 'var(--color-status-success)' }}>{p.selesai}</td>
            <td style={{ padding: '12px 24px', color: p.overdue > 0 ? 'var(--color-status-danger)' : 'inherit' }}>{p.overdue}</td>
            <td style={{ padding: '12px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '6px', background: 'var(--color-hairline)', borderRadius: '3px' }}>
                  <div style={{
                    width: `${p.completion_rate}%`, height: '100%',
                    background: p.completion_rate >= 80 ? 'var(--color-status-success)' : p.completion_rate >= 50 ? 'var(--color-status-warning)' : 'var(--color-status-danger)',
                    borderRadius: '3px'
                  }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', minWidth: '36px' }}>{p.completion_rate}%</span>
              </div>
            </td>
            <td style={{ padding: '12px 24px' }}>
              <button onClick={() => onDetail && onDetail()} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center' }}>Detail <ChevronRight size={14} /></button>
            </td>
          </tr>
        )
      }}
    />
  );
};

export default SpvDepartmentDashboard;
