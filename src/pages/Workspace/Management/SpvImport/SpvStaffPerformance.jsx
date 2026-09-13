import React from 'react';
import ManagementWorkspace from '../../../../components/ManagementWorkspace';
import { Users, CheckCircle, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import useAuthStore from '../../../../store/useAuthStore';
import useSPVData from '../../../../hooks/useSPVData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const SpvStaffPerformance = () => {
  const { user } = useAuthStore();
  const dept = user?.departemen;
  
  const { data: staffPerformance, loading, error } = useSPVData(`/api/control-tower/staff-performance?departemen=${dept}`);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat Staff Performance...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>;

  const performanceList = staffPerformance || [];
  const totalStaff = performanceList.length;
  const totalCompleted = performanceList.reduce((acc, curr) => acc + curr.selesai, 0);
  
  const totalRate = performanceList.reduce((acc, curr) => acc + curr.completion_rate, 0);
  const avgSla = totalStaff > 0 ? Math.round(totalRate / totalStaff) : 0;

  const chartData = performanceList.map(staff => ({
    name: staff.nama,
    completed: staff.selesai,
    active: staff.tugas_aktif
  }));

  return (
    <ManagementWorkspace
      title="Staff Performance"
      subtitle={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Memantau produktivitas, beban kerja, dan SLA penyelesaian tugas masing-masing staf departemen {dept}.</span>
          <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '8px' }}>
            Data tersinkronisasi realtime dengan seluruh tugas staf.
          </span>
        </div>
      }
      summaryCards={[
        { label: 'Total Staff', value: totalStaff.toString(), trend: 'Active', trendColor: '#0066cc', icon: <Users size={20} /> },
        { label: 'Total Tasks Completed', value: totalCompleted.toString(), trend: 'This Month', trendColor: '#34c759', icon: <CheckCircle size={20} /> },
        { label: 'Average Completion Rate', value: `${avgSla}%`, trend: 'Performance', trendColor: avgSla >= 80 ? '#34c759' : '#ff9500', icon: <Clock size={20} /> }
      ]}
      tableConfig={{
        headers: ['Staff Name', 'Tipe', 'Active Tasks', 'Completed Tasks', 'Completion Rate', 'Status', 'Aksi'],
        data: performanceList,
        renderRow: (item, idx, onDetail) => {
          return (
            <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
              <td style={{ padding: '14px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                    {item.nama.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{item.nama}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)' }}>{item.employee_id}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '14px 24px', color: 'var(--color-ink-muted-80)' }}>{item.tipe_karyawan}</td>
              <td style={{ padding: '14px 24px', fontWeight: '600' }}>{item.tugas_aktif}</td>
              <td style={{ padding: '14px 24px', fontWeight: '600', color: '#34c759' }}>{item.selesai}</td>
              <td style={{ padding: '14px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '60px', height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.completion_rate}%`, height: '100%', backgroundColor: item.completion_rate >= 80 ? '#34c759' : (item.completion_rate >= 50 ? '#ff9500' : '#ff3b30') }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>{item.completion_rate}%</span>
                </div>
              </td>
              <td style={{ padding: '14px 24px' }}>
                <span style={{ 
                  backgroundColor: item.tugas_aktif > 15 ? '#fff2e0' : '#e7f8ec', 
                  color: item.tugas_aktif > 15 ? '#ff9500' : '#34c759', 
                  padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' 
                }}>
                  {item.tugas_aktif > 15 ? 'Overloaded' : 'Optimal'}
                </span>
              </td>
              <td style={{ padding: '14px 24px' }}>
                <button onClick={() => onDetail && onDetail()} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center' }}>Detail <ChevronRight size={14} /></button>
              </td>
            </tr>
          );
        }
      }}
      chartPanel={
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--color-primary)" /> Task Completion Velocity
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--color-ink-muted-80)'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--color-ink-muted-80)'}} />
                  <RechartsTooltip cursor={{fill: '#f5f5f5'}} />
                  <Bar dataKey="completed" name="Completed Tasks" fill="#34c759" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="active" name="Active Tasks" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      }
    />
  );
};

export default SpvStaffPerformance;
