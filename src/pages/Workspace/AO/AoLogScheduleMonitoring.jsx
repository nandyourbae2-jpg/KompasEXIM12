import React, { useState, useEffect, useMemo } from 'react';
import { Database, RefreshCw, Search, Calendar, Package, MapPin, Ship, UserCheck } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import './AoLogScheduleMonitoring.css';

const AoLogScheduleMonitoring = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState({ activeImport: null, records: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [etdFilter, setEtdFilter] = useState('All'); // 'All', 'This Week', 'This Month'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v2/source/active-schedule', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch active schedule');
      setData({ activeImport: json.data.activeImport, records: json.data.records || [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and compute metrics
  const { filteredRecords, metrics } = useMemo(() => {
    const records = data.records || [];
    let filtered = records;

    // Search query
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        (r.raw_invoice_no || '').toLowerCase().includes(lowerQ) ||
        (r.raw_buyer || '').toLowerCase().includes(lowerQ) ||
        (r.raw_vessel || '').toLowerCase().includes(lowerQ) ||
        (r.raw_destination || '').toLowerCase().includes(lowerQ)
      );
    }

    // ETD Filter (Simplified for now)
    if (etdFilter === 'This Week') {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => {
        if (!r.raw_etd) return false;
        const d = new Date(r.raw_etd);
        return d >= now && d <= nextWeek;
      });
    } else if (etdFilter === 'This Month') {
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => {
        if (!r.raw_etd) return false;
        const d = new Date(r.raw_etd);
        return d >= now && d <= nextMonth;
      });
    }

    // Compute metrics
    const uniqueBuyers = new Set();
    const uniquePorts = new Set();
    const uniqueLiners = new Set();
    let totalContainers = 0;

    filtered.forEach(r => {
      if (r.raw_buyer) uniqueBuyers.add(r.raw_buyer);
      if (r.raw_destination) uniquePorts.add(r.raw_destination);
      if (r.raw_liner) uniqueLiners.add(r.raw_liner);
      
      if (r.raw_qty) {
         const match = r.raw_qty.match(/(\d+)/);
         if (match) totalContainers += parseInt(match[1], 10);
      }
    });

    return {
      filteredRecords: filtered,
      metrics: {
        totalShipments: filtered.length,
        uniqueBuyers: uniqueBuyers.size,
        uniquePorts: uniquePorts.size,
        uniqueLiners: uniqueLiners.size,
        totalContainers
      }
    };
  }, [data.records, searchQuery, etdFilter]);

  const MetricCard = ({ title, value, icon, subtitle }) => (
    <div className="ao-metric-card">
      <div className="ao-metric-icon">{icon}</div>
      <div className="ao-metric-content">
        <span className="ao-metric-title">{title}</span>
        <div className="ao-metric-value">{value}</div>
        {subtitle && <span className="ao-metric-subtitle">{subtitle}</span>}
      </div>
    </div>
  );

  return (
    <div className="ao-log-monitoring-container">
      <header className="ao-header">
        <div className="ao-header-left">
          <div className="ao-title-row">
            <h1 className="ao-page-title">Jadwal Shipment (Log Schedule)</h1>
            <span className="ao-readonly-badge">
              <Database size={14} /> Mode Monitoring Read-Only • Sumber: SPV AE
            </span>
          </div>
          <p className="ao-page-subtitle">Pantau jadwal pengiriman untuk persiapan LC, draft BL, dan fasilitas perbankan.</p>
        </div>
        <div className="ao-header-right">
          <button 
            className={`apple-btn-secondary ${loading ? 'loading' : ''}`}
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>
      </header>

      {error && (
        <div className="ao-error-banner">
          Gagal memuat data: {error}
        </div>
      )}

      {data.activeImport && (
        <div className="ao-active-banner">
          <div className="ao-banner-content">
            <strong>Active Source:</strong> {data.activeImport.file_name} 
            <span className="ao-banner-divider">|</span> 
            Diunggah oleh {data.activeImport.uploaded_by_name} 
            <span className="ao-banner-divider">|</span> 
            {new Date(data.activeImport.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      )}

      <div className="ao-metrics-grid">
        <MetricCard 
          title="Active Shipments" 
          value={metrics.totalShipments} 
          icon={<Package size={24} />} 
          subtitle="Shipment dalam filter"
        />
        <MetricCard 
          title="Unique Buyers" 
          value={metrics.uniqueBuyers} 
          icon={<UserCheck size={24} />} 
        />
        <MetricCard 
          title="Tujuan (Port)" 
          value={metrics.uniquePorts} 
          icon={<MapPin size={24} />} 
        />
        <MetricCard 
          title="Liners" 
          value={metrics.uniqueLiners} 
          icon={<Ship size={24} />} 
        />
        <MetricCard 
          title="Estimasi Kontainer" 
          value={metrics.totalContainers} 
          icon={<Database size={24} />} 
          subtitle="Total TEUs"
        />
      </div>

      <div className="ao-controls-bar">
        <div className="ao-search-wrapper">
          <Search size={16} className="ao-search-icon" />
          <input 
            type="text" 
            placeholder="Cari Invoice, Buyer, Vessel, Tujuan..." 
            className="ao-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="ao-filters">
          <div className="apple-segmented-control">
            {['All', 'This Week', 'This Month'].map(opt => (
              <button
                key={opt}
                className={`apple-segment-btn ${etdFilter === opt ? 'active' : ''}`}
                onClick={() => setEtdFilter(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ao-table-container">
        {loading ? (
          <div className="ao-loading-state">Memuat data Log Schedule...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="ao-empty-state">Tidak ada jadwal shipment yang sesuai.</div>
        ) : (
          <table className="apple-table ao-log-table">
            <thead>
              <tr>
                <th>Invoice & Buyer</th>
                <th>Tujuan</th>
                <th>Vessel & Liner</th>
                <th>Jadwal Closing</th>
                <th>ETD / ETA</th>
                <th>Volume</th>
                <th>Fasilitas</th>
                <th>Staf AE</th>
                <th>Staf AO Pendamping</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <div className="ao-td-main">{rec.raw_invoice_no || '-'}</div>
                    <div className="ao-td-sub">{rec.raw_buyer || '-'}</div>
                  </td>
                  <td>
                    <div className="ao-td-main">{rec.raw_destination || '-'}</div>
                  </td>
                  <td>
                    <div className="ao-td-main">{rec.raw_vessel || '-'}</div>
                    <div className="ao-td-sub">{rec.raw_liner || '-'}</div>
                  </td>
                  <td>
                    <div className="ao-td-main">{rec.raw_closing_docs || '-'}</div>
                  </td>
                  <td>
                    <div className="ao-td-main">ETD: {rec.raw_etd || '-'}</div>
                    <div className="ao-td-sub">ETA: {rec.raw_eta || '-'}</div>
                  </td>
                  <td>
                    <div className="ao-td-main">{rec.raw_qty || '-'}</div>
                    <div className="ao-td-sub">{rec.raw_gudang || '-'}</div>
                  </td>
                  <td>
                    <div className="ao-td-sub">{rec.raw_fasilitas_kite || '-'}</div>
                    <div className="ao-td-sub">{rec.raw_no_bc || '-'}</div>
                  </td>
                  <td>
                    {rec.job_code ? (
                      <div>
                        <span className="ao-status-pill assigned" style={{ display: 'block', marginBottom: '4px' }}>
                          {rec.ae_assignee_name || 'Pipeline Created'}
                        </span>
                        {rec.ae_handover_status && rec.ae_handover_status !== 'Not Started' && (
                          <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 7px', borderRadius: '999px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'inline-block' }}>
                            {rec.ae_handover_status}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="ao-status-pill unassigned">Unassigned</span>
                    )}
                  </td>
                  <td>
                    {rec.ao_assignee_name ? (
                      <span className="ao-status-pill assigned" style={{ backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }}>
                        ✓ {rec.ao_assignee_name}
                      </span>
                    ) : rec.job_code ? (
                      <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>Belum dicocokkan</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#d1d5db' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AoLogScheduleMonitoring;
