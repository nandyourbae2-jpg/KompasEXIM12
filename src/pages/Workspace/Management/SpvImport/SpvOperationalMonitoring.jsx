import React, { useMemo } from 'react';
import ManagementWorkspace from '../../../../components/ManagementWorkspace';
import { Package, Truck, AlertTriangle, ChevronRight, BarChart2, AlertCircle } from 'lucide-react';
import useSPVData from '../../../../hooks/useSPVData';
import { StageBadge } from '../../../../components/SPV/SPVSharedComponents';

const SpvOperationalMonitoring = () => {
  const { data: shipments, loading, error } = useSPVData('/api/import-shipments');

  // Compute metrics only when shipments change
  const { data, activeShipments, truckingProgress, bottleneckMetrics, containerAlerts } = useMemo(() => {
    if (!shipments) return { data: [], activeShipments: [], truckingProgress: [], bottleneckMetrics: {}, containerAlerts: [] };

    // 1. FILTER: Only include shipments with an IMP Number (starts with 'IMP-')
    const filteredData = shipments.filter(s => s.un && s.un.startsWith('IMP-'));

    const active = filteredData.filter(s => s.stage === 'Shipment Active' || s.stage === 'Delivery Active');
    const trucking = filteredData.filter(s => s.stage === 'Delivery Active');

    // 2. DATA-DRIVEN BOTTLENECKS
    // Track totals and counts to compute averages
    let totalGateOut = 0, countGateOut = 0;
    let totalTrucking = 0, countTrucking = 0;
    let totalUnloading = 0, countUnloading = 0;

    // 3. CONTAINER ALERTS
    const alerts = [];

    filteredData.forEach(shipment => {
      const ataDate = shipment.ata ? new Date(shipment.ata) : null;
      const freeTime = shipment.free_time_destination || 3; // Default 3 if not set

      (shipment.containers || []).forEach(c => {
        // Compute Gate Out (Gate Out - ATA)
        if (ataDate && c.gate_out) {
          const goDate = new Date(c.gate_out);
          const diffDays = (goDate - ataDate) / (1000 * 60 * 60 * 24);
          if (diffDays >= 0) {
            totalGateOut += diffDays;
            countGateOut++;
          }
        }
        
        // Compute Trucking (Gate In WH - Gate Out)
        if (c.gate_out && c.gate_in_wh) {
          const goDate = new Date(c.gate_out);
          const giDate = new Date(c.gate_in_wh);
          const diffDays = (giDate - goDate) / (1000 * 60 * 60 * 24);
          if (diffDays >= 0) {
            totalTrucking += diffDays;
            countTrucking++;
          }
        }

        // Compute Unloading (Offloading End - Offloading Start)
        if (c.offloading_start && c.offloading_end) {
          const osDate = new Date(c.offloading_start);
          const oeDate = new Date(c.offloading_end);
          const diffDays = (oeDate - osDate) / (1000 * 60 * 60 * 24);
          if (diffDays >= 0) {
            totalUnloading += diffDays;
            countUnloading++;
          }
        }

        // Container Alerts Check
        if (c.fish_issue || c.queue_issue || c.space_issue || c.other_issue) {
          const issues = [];
          if (c.fish_issue) issues.push('Fish Issue');
          if (c.queue_issue) issues.push('Queue Issue');
          if (c.space_issue) issues.push('Space Issue');
          if (c.other_issue) issues.push('Other Issue');
          
          alerts.push({
            id: c.id,
            shipment: shipment.un,
            kontainer: c.no_kontainer,
            issues: issues.join(', ')
          });
        }
      });
    });

    return {
      data: filteredData,
      activeShipments: active,
      truckingProgress: trucking,
      containerAlerts: alerts,
      bottleneckMetrics: {
        // Historical fixed average for stages without exact timestamp tracking in DB
        customs: { avg: 1.2, isWarning: false }, 
        document: { avg: 0.5, isWarning: false },
        
        // Data-driven averages
        gateOut: { 
          avg: countGateOut > 0 ? (totalGateOut / countGateOut) : 2.5,
          // Gate Out limit is usually based on free_time_destination (~3 days)
          isWarning: countGateOut > 0 && (totalGateOut / countGateOut) > 3 
        },
        trucking: { 
          avg: countTrucking > 0 ? (totalTrucking / countTrucking) : 3.1,
          // Trucking historical average is ~1.5 days. Warning if > 2.
          isWarning: countTrucking > 0 && (totalTrucking / countTrucking) > 2 
        },
        unloading: { 
          avg: countUnloading > 0 ? (totalUnloading / countUnloading) : 0.8,
          // Unloading historical average is ~1 day. Warning if > 1.5.
          isWarning: countUnloading > 0 && (totalUnloading / countUnloading) > 1.5 
        }
      }
    };
  }, [shipments]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat Operational Monitoring...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>;

  // Interactive Bar component for Bottleneck chart
  const InteractiveBar = ({ label, metric, maxDays }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
      // Trigger animation after mount
      const timer = setTimeout(() => setMounted(true), 150);
      return () => clearTimeout(timer);
    }, []);

    // Calculate height percentage (max 100px for maxDays). Base minimum height is 4px.
    const targetHeight = Math.min(100, Math.max(4, (metric.avg / maxDays) * 100));
    const finalHeight = mounted ? targetHeight : 0;
    
    const bgColor = metric.isWarning ? '#ff3b30' : (metric.avg > (maxDays * 0.6) ? '#ff9500' : '#34c759');
    const color = metric.isWarning ? '#ff3b30' : 'var(--color-ink-muted-80)';
    
    return (
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
      >
        <div style={{ 
          width: '100%', 
          height: `${finalHeight}px`, 
          backgroundColor: bgColor, 
          borderRadius: '4px 4px 0 0', 
          transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s, transform 0.2s',
          opacity: isHovered ? 0.85 : 1,
          transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
          transformOrigin: 'bottom'
        }} />
        <div style={{ fontSize: '11px', fontWeight: '600', textAlign: 'center', transition: 'all 0.2s ease', transform: isHovered ? 'translateY(-2px)' : 'none' }}>
          {label}<br/>
          <span style={{ color }}>Avg {metric.avg.toFixed(1)} Days</span>
        </div>
      </div>
    );
  };

  // Dynamically calculate maxDays for better bar scaling (Operational only)
  const allAvgs = [
    bottleneckMetrics.gateOut.avg,
    bottleneckMetrics.trucking.avg,
    bottleneckMetrics.unloading.avg
  ];
  const dynamicMaxDays = Math.max(3, Math.max(...allAvgs));

  return (
    <ManagementWorkspace
      title="Operational Monitoring"
      subtitle={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Pemantauan lapangan (Port & Warehouse) dan status kedatangan kontainer.</span>
          <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '8px' }}>
            Data ini difilter otomatis hanya untuk yang memiliki IMP Number (Data-Driven).
          </span>
        </div>
      }
      summaryCards={[
        { label: 'Active Shipments', value: activeShipments.length.toString(), trend: 'In Field', trendColor: '#0066cc', icon: <Package size={20} /> },
        { label: 'Trucking in Progress', value: truckingProgress.length.toString(), trend: 'Moving', trendColor: '#34c759', icon: <Truck size={20} /> },
        { label: 'SLA Delay Issues', value: containerAlerts.length.toString(), trend: 'Bottlenecks', trendColor: containerAlerts.length > 0 ? '#ff3b30' : '#34c759', icon: <AlertTriangle size={20} /> },
      ]}
      tableConfig={{
        headers: ['UN', 'Supplier', 'Mode', 'Gudang', 'ETA', 'ATA', 'Kontainer', 'Stage', 'Aksi'],
        data: data,
        renderRow: (item, idx, onDetail) => (
          <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
            <td style={{ padding: '14px 24px', fontWeight: '600', color: 'var(--color-primary)' }}>{item.un}</td>
            <td style={{ padding: '14px 24px', fontWeight: '600', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.supplier}>{item.supplier}</td>
            <td style={{ padding: '14px 24px', color: 'var(--color-ink-muted-80)' }}>{item.mode_transport}</td>
            <td style={{ padding: '14px 24px' }}>{item.gudang}</td>
            <td style={{ padding: '14px 24px' }}>{item.eta || '-'}</td>
            <td style={{ padding: '14px 24px' }}>{item.ata || '—'}</td>
            <td style={{ padding: '14px 24px', textAlign: 'center' }}>{item.container_count || 0}</td>
            <td style={{ padding: '14px 24px' }}>
              <StageBadge stage={item.stage} />
            </td>
            <td style={{ padding: '14px 24px' }}>
              <button onClick={() => onDetail && onDetail()} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center' }}>Detail <ChevronRight size={14} /></button>
            </td>
          </tr>
        )
      }}
      actionPanel={
        <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)', padding: '24px', maxHeight: '500px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="var(--color-ink)" /> Container Alerts
          </h3>
          
          {containerAlerts.length === 0 ? (
            <div style={{ padding: '12px', color: 'var(--color-ink-muted-48)', fontSize: '13px', backgroundColor: '#f9f9f9', borderRadius: '6px', textAlign: 'center' }}>
              Tidak ada isu lapangan saat ini. Semua on track.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {containerAlerts.map((alert, i) => (
                <div key={i} style={{ padding: '12px', borderLeft: '3px solid #ff3b30', backgroundColor: '#fff5f5', borderRadius: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#cc2922' }}>{alert.kontainer || 'Unknown Container'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '4px' }}>
                    <strong>Issue:</strong> {alert.issues} <br/>
                    <strong>Shipment:</strong> {alert.shipment}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      }
      chartPanel={
        <div style={{ backgroundColor: 'white', padding: '0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <BarChart2 size={18} color="var(--color-ink)" />
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Bottleneck Analysis (Data-Driven)</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', position: 'relative', height: '120px' }}>
            
            <InteractiveBar label="Gate Out (Port)" metric={bottleneckMetrics.gateOut} maxDays={dynamicMaxDays} />
            <InteractiveBar label="Trucking (Perjalanan)" metric={bottleneckMetrics.trucking} maxDays={dynamicMaxDays} />
            <InteractiveBar label="Warehouse Unloading" metric={bottleneckMetrics.unloading} maxDays={dynamicMaxDays} />
            
            <div style={{ position: 'absolute', bottom: '38px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--color-hairline)' }} />
          </div>
        </div>
      }
    />
  );
};

export default SpvOperationalMonitoring;
