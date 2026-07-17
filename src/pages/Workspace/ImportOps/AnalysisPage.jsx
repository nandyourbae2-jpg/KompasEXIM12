import React from 'react';
import { BarChart2, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useImportOperationalStore from '../../../store/useImportOperationalStore';
import useAuthStore from '../../../store/useAuthStore';
import { getSupervisorPageTitle } from '../../../utils/authHelpers';

const AnalysisPage = () => {
  const { user } = useAuthStore();
  const { shipments } = useImportOperationalStore();

  const activeShipments = shipments.filter(s => s.status !== 'Selesai');

  const Th = ({ children, right }) => (
    <th style={{
      padding: '12px 16px',
      textAlign: right ? 'right' : 'left',
      fontSize: '11px', fontWeight: '600',
      color: 'var(--color-ink-muted-48)',
      textTransform: 'uppercase', letterSpacing: '0.5px',
      borderBottom: '1px solid var(--color-hairline)',
      backgroundColor: 'var(--color-canvas)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );

  const Td = ({ children, right, bold, error }) => (
    <td style={{
      padding: '12px 16px',
      textAlign: right ? 'right' : 'left',
      fontSize: '13px',
      fontWeight: bold ? '600' : '400',
      color: error ? 'var(--color-status-danger)' : 'var(--color-ink)',
      borderBottom: '1px solid var(--color-hairline)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </td>
  );

  const MetricCard = ({ title, value, unit, icon: Icon, color }) => (
    <div style={{
      backgroundColor: 'var(--color-canvas)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--rounded-lg)',
      padding: '20px',
      display: 'flex', alignItems: 'center', gap: '16px',
      boxShadow: 'var(--shadow-product)',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        backgroundColor: `${color}15`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-ink)' }}>
          {value} <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--color-ink-muted-48)' }}>{unit}</span>
        </div>
      </div>
    </div>
  );

  // Ekstrak semua kontainer dari shipment aktif
  const allContainers = activeShipments.flatMap(s => 
    (s.containers || []).map((c, idx) => ({
      ...c,
      shipmentId: s.id,
      un: s.un,
      kat: s.kat,
      supplier: s.supplier,
      gudang: s.gudang,
      contName: c.cont || `Cont ${idx+1}`,
      displayName: `${s.un || s.id} - ${c.cont || `C${idx+1}`}`
    }))
  );

  // Kalkulasi rata-rata
  const avgDurasi = allContainers.length > 0
    ? allContainers.reduce((sum, c) => sum + (Number(c.durasioBongkar) || 0), 0) / allContainers.length
    : 0;
  
  const avgInap = allContainers.length > 0
    ? allContainers.reduce((sum, c) => sum + (Number(c.lamaInapSasis) || 0), 0) / allContainers.length
    : 0;

  // Isu terbanyak
  const issueCounts = { fish: 0, queue: 0, space: 0, other: 0 };
  allContainers.forEach(c => {
    if (c.fishIssue) issueCounts.fish++;
    if (c.queueIssue) issueCounts.queue++;
    if (c.spaceIssue) issueCounts.space++;
    if (c.otherIssue) issueCounts.other++;
  });
  
  let topIssue = 'Tidak ada';
  let topIssueCount = 0;
  Object.entries(issueCounts).forEach(([issue, count]) => {
    if (count > topIssueCount) {
      topIssue = issue.charAt(0).toUpperCase() + issue.slice(1) + ' Issue';
      topIssueCount = count;
    }
  });

  const chartData = allContainers.map(c => ({
    name: c.displayName,
    durasiBongkar: Number(c.durasioBongkar) || 0,
    lamaInapSasis: Number(c.lamaInapSasis) || 0
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)' }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px 20px',
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{
            width: '36px', height: '36px',
            backgroundColor: 'var(--color-canvas-parchment)',
            borderRadius: 'var(--rounded-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart2 size={18} color="var(--color-ink-muted-80)" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.374px' }}>
            {getSupervisorPageTitle('Operasional Analysis', user)}
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', marginLeft: '48px' }}>
          Analisis metrik durasi bongkar, waktu antri, dan inefisiensi operasional.
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <MetricCard title="Rata-rata Durasi Bongkar" value={avgDurasi.toFixed(1)} unit="Jam" icon={Clock} color="#0066cc" />
          <MetricCard title="Rata-rata Inap Sasis" value={avgInap.toFixed(1)} unit="Jam" icon={TrendingUp} color="#ff9500" />
          <MetricCard title="Issue Terbanyak" value={topIssue} unit={`(${topIssueCount} Kasus)`} icon={BarChart2} color="#ff3b30" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', boxShadow: 'var(--shadow-product)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Durasi Bongkar (Jam)</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-ink-muted-80)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--color-ink-muted-80)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="durasiBongkar" name="Durasi Bongkar" fill="#0066cc" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px', boxShadow: 'var(--shadow-product)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Lama Inap Sasis (Trucking Usage)</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-ink-muted-80)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--color-ink-muted-80)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="lamaInapSasis" name="Lama Inap Sasis" fill="#ff9500" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--color-canvas)',
          border: '1px solid var(--color-hairline)',
          borderRadius: 'var(--rounded-lg)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)', fontSize: '15px', fontWeight: '600' }}>
            Tabel Evaluasi Waktu
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <Th>UN / Kategori</Th>
                  <Th>Kontainer</Th>
                  <Th>Gudang</Th>
                  <Th right>Lama Inap Sasis</Th>
                  <Th right>Waktu Antri</Th>
                  <Th right>Durasi Bongkar</Th>
                  <Th>Isu</Th>
                </tr>
              </thead>
              <tbody>
                {allContainers.map((c, i) => {
                  const issues = [];
                  if (c.fishIssue) issues.push('Fish');
                  if (c.queueIssue) issues.push('Queue');
                  if (c.spaceIssue) issues.push('Space');
                  if (c.otherIssue) issues.push('Other');

                  return (
                    <tr key={`${c.shipmentId}-${i}`}>
                      <Td bold>{c.un || '—'} <span style={{ fontWeight: '400', color: 'var(--color-ink-muted-48)', marginLeft: '6px' }}>({c.kat})</span></Td>
                      <Td>{c.contName}</Td>
                      <Td>{c.gudang || '—'}</Td>
                      <Td right error={c.lamaInapSasis > 24}>{c.lamaInapSasis || 0} Jam</Td>
                      <Td right error={c.waktuAntri > 5}>{c.waktuAntri || 0} Jam</Td>
                      <Td right error={c.durasioBongkar > 10}>{c.durasioBongkar || 0} Jam</Td>
                      <Td>
                        {issues.length > 0 ? (
                          <span style={{
                            backgroundColor: 'var(--color-status-danger-bg)', color: 'var(--color-status-danger)',
                            padding: '2px 8px', borderRadius: 'var(--rounded-xs)', fontSize: '11px', fontWeight: '600'
                          }}>
                            {issues.join(', ')}
                          </span>
                        ) : '—'}
                      </Td>
                    </tr>
                  );
                })}
                {allContainers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--color-ink-muted-48)' }}>
                      Belum ada data kontainer aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
