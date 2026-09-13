import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, ChevronRight, AlertCircle, Clock, Bell, X } from 'lucide-react';
import NotificationCenter from './SPV/NotificationCenter';
import { useAppleModal } from '../contexts/AppleModalContext';
import useSpvStore from '../store/useSpvStore';

const ManagementWorkspace = ({ 
  title, 
  subtitle, 
  summaryCards = [], 
  tableConfig = { headers: [], data: [], renderRow: null }, 
  actionPanel = null, 
  chartPanel = null 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const { alert } = useAppleModal();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // BroadcastChannel listener with visibility check and cleanup
  useEffect(() => {
    const channel = new BroadcastChannel('exim_sync_channel');
    channel.onmessage = (event) => {
      if (event.data?.type === 'DATA_UPDATED' || event.data === 'DATA_UPDATED') {
        if (document.visibilityState === 'visible') {
          console.log('[SPV Sync] Data updated, reloading data for active tab...');
          const store = useSpvStore.getState();
          const sessionData = sessionStorage.getItem('kompas_exim_session');
          if (sessionData) {
            try {
              const { user } = JSON.parse(sessionData);
              if (user && user.departemen) {
                store.fetchDashboardData(user.departemen).catch(() => {});
                store.fetchAssignmentCenter().catch(() => {});
                store.fetchShipmentMonitoring().catch(() => {});
                store.fetchFinancialMonitoring().catch(() => {});
                store.fetchIssues().catch(() => {});
                store.fetchVendors().catch(() => {});
              }
            } catch (e) {
              console.error('[SPV Sync] Error parsing session data', e);
            }
          }
        }
      }
    };
    return () => channel.close();
  }, []);

  const filteredData = useMemo(() => {
    if (!tableConfig.data) return [];
    if (!debouncedSearch) return tableConfig.data;
    const lowerSearch = debouncedSearch.toLowerCase();
    return tableConfig.data.filter(item => JSON.stringify(item).toLowerCase().includes(lowerSearch));
  }, [tableConfig.data, debouncedSearch]);

  const handleExportCSV = async () => {
    if (!tableConfig.data || tableConfig.data.length === 0) {
      await alert("Tidak ada data untuk diekspor.");
      return;
    }
    
    // Convert object to CSV string
    const dataToExport = filteredData;
    if (dataToExport.length === 0) return;
    
    // Get headers from first object
    const keys = Object.keys(dataToExport[0]).filter(k => k !== 'password_hash' && k !== 'password');
    const csvContent = [
      keys.join(','),
      ...dataToExport.map(item => keys.map(k => `"${(item[k] !== null && item[k] !== undefined) ? String(item[k]).replace(/"/g, '""') : ''}"`).join(','))
    ].join('\\n');

    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Export_${title.replace(/\\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--color-canvas-parchment)',
      overflowY: 'auto',
      fontFamily: 'var(--font-family-body)',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '32px 40px',
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '-0.5px',
              color: 'var(--color-ink)',
              marginBottom: '8px',
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{
                fontSize: '15px',
                color: 'var(--color-ink-muted-80)',
                maxWidth: '600px',
              }}>
                {subtitle}
              </p>
            )}
          </div>
          <div>
            <NotificationCenter />
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* ── Summary Cards ── */}
        {summaryCards.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`,
            gap: '24px',
          }}>
            {summaryCards.map((card, idx) => (
              <div 
                key={idx} 
                onClick={card.onClick}
                style={{
                  backgroundColor: 'var(--color-canvas)',
                  borderRadius: 'var(--rounded-lg)',
                  padding: '24px',
                  border: '1px solid var(--color-hairline)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.01)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: card.onClick ? 'pointer' : 'default',
                  transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--color-ink-muted-80)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {card.label}
                  </div>
                  {card.icon && (
                    <div style={{ color: 'var(--color-ink-muted-48)' }}>
                      {card.icon}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: 'var(--color-ink)',
                  letterSpacing: '-0.5px',
                }}>
                  {card.value}
                </div>
                {card.trend && (
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: card.trendColor || 'var(--color-ink-muted-80)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    {card.trend}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Main Content Area ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: actionPanel ? '1fr 340px' : '1fr',
          gap: '24px',
        }}>
          
          {/* Left/Middle: Smart Table */}
          <div style={{
            backgroundColor: 'var(--color-canvas)',
            borderRadius: 'var(--rounded-lg)',
            border: '1px solid var(--color-hairline)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Toolbar */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--color-hairline)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafafa',
            }}>
              <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--color-canvas)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--rounded-pill)',
                  padding: '6px 16px',
                  width: '300px',
                }}>
                  <Search size={14} color="var(--color-ink-muted-48)" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '13px',
                      color: 'var(--color-ink)',
                      width: '100%',
                    }}
                  />
                </div>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--rounded-pill)',
                  border: '1px solid var(--color-hairline)',
                  backgroundColor: 'var(--color-canvas)',
                  fontSize: '13px', fontWeight: '500', color: 'var(--color-ink)',
                  cursor: 'pointer',
                }}>
                  <Filter size={14} /> Filter
                </button>
              </div>
              <div>
                <button onClick={handleExportCSV} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--rounded-pill)',
                  border: '1px solid var(--color-hairline)',
                  backgroundColor: 'var(--color-canvas)',
                  fontSize: '13px', fontWeight: '500', color: 'var(--color-ink)',
                  cursor: 'pointer',
                }}>
                  <Download size={14} /> Export
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-canvas)' }}>
                    {tableConfig.headers.map((h, i) => (
                      <th key={i} style={{
                        padding: '14px 24px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--color-ink-muted-48)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid var(--color-hairline)',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={tableConfig.headers.length} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted-48)', fontSize: '14px' }}>
                        Tidak ada data untuk ditampilkan.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      tableConfig.renderRow(item, idx, () => setSelectedRow(item))
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Action Panel */}
          {actionPanel && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}>
              {actionPanel}
            </div>
          )}

        </div>

        {/* ── Bottom: Charts ── */}
        {chartPanel && (
          <div style={{
            backgroundColor: 'var(--color-canvas)',
            borderRadius: 'var(--rounded-lg)',
            border: '1px solid var(--color-hairline)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)',
            padding: '32px',
          }}>
            {chartPanel}
          </div>
        )}
        
      </div>
      
      {/* Generic Detail Modal Overlay */}
      {selectedRow && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Detail Informasi</h2>
              <button onClick={() => setSelectedRow(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} color="var(--color-ink-muted-48)" /></button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(selectedRow).filter(([key]) => key !== 'password_hash' && key !== 'password').map(([key, value]) => (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-ink)', wordBreak: 'break-word' }}>
                    {value === null || value === undefined ? '-' : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-hairline)', backgroundColor: '#f9f9f9', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedRow(null)} style={{ padding: '8px 16px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementWorkspace;
