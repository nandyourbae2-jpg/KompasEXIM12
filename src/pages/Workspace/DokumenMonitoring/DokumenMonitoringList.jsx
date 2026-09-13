import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import useDokumenMonitoringStore from '../../../store/useDokumenMonitoringStore';

const DokumenMonitoringList = () => {
  const navigate = useNavigate();
  const { monitoringList, monitoringListLoading, fetchMonitoringSummary } = useDokumenMonitoringStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMonitoringSummary();
  }, [fetchMonitoringSummary]);

  // Filter based on search query
  const filteredList = monitoringList.filter(project => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      project.task_unique_number?.toLowerCase().includes(q) ||
      project.invoice_no?.toLowerCase().includes(q) ||
      project.po_co_no?.toLowerCase().includes(q) ||
      project.bl_no?.toLowerCase().includes(q) ||
      project.supplier?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--color-canvas-parchment)'
    }}>
      {/* ── Header ── */}
      <div style={{ 
        padding: '24px 32px', 
        borderBottom: '1px solid var(--color-hairline)',
        backgroundColor: 'var(--color-canvas)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '34px', 
            fontWeight: 600, 
            lineHeight: 1.1,
            letterSpacing: '-0.374px',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-family-display)',
            margin: 0,
          }}>
            Dokumen Monitoring
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', margin: '4px 0 0 0' }}>
            Pantau kelengkapan dokumen untuk setiap Import Project.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--color-canvas)',
          border: '1px solid var(--color-hairline)',
          borderRadius: 'var(--rounded-pill)',
          padding: '8px 16px',
          width: '320px',
        }}>
          <Search size={16} color="var(--color-ink-muted-48)" />
          <input
            type="text"
            placeholder="Cari Task No, Invoice, PO, BL, Supplier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '13px',
              fontFamily: 'var(--font-family-body)',
              backgroundColor: 'transparent',
            }}
          />
        </div>
      </div>

      {/* ── Table Area ── */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{
          backgroundColor: 'var(--color-canvas)',
          border: '1px solid var(--color-hairline)',
          borderRadius: 'var(--rounded-lg)',
          overflow: 'hidden'
        }}>
          {monitoringListLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
              Memuat data...
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
              Tidak ada data import project yang ditemukan.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted-48)', width: '12%' }}>Task Unique No</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted-48)', width: '15%' }}>Supplier</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted-48)', width: '12%' }}>Invoice No</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted-48)', width: '12%' }}>PO/CO No</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted-48)', width: '12%' }}>B/L No</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted-48)', width: '9%' }}>ETD</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted-48)', width: '9%' }}>ETA</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted-48)', width: '15%' }}>Progress Dokumen</th>
                  <th style={{ padding: '12px 16px', width: '4%' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((project, idx) => {
                  const isComplete = project.doc_complete === project.doc_total && project.doc_total > 0;
                  const isStarted = project.doc_complete > 0;
                  const badgeColor = isComplete 
                    ? { bg: 'var(--color-status-success-bg)', text: 'var(--color-status-success)' }
                    : isStarted 
                      ? { bg: 'var(--color-status-warning-bg)', text: 'var(--color-status-warning)' }
                      : { bg: 'var(--color-status-danger-bg)', text: 'var(--color-status-danger)' };

                  return (
                    <tr 
                      key={project.id} 
                      onClick={() => navigate(`/workspace/dokumen-monitoring/${project.id}`)}
                      style={{ 
                        borderBottom: idx === filteredList.length - 1 ? 'none' : '1px solid var(--color-hairline)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas)'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-primary)', fontWeight: 500 }}>
                        {project.task_unique_number}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-ink)' }}>{project.supplier}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-ink)' }}>{project.invoice_no || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-ink)' }}>{project.po_co_no || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-ink)' }}>{project.bl_no || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-ink)' }}>{project.etd || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-ink)' }}>{project.eta || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px 10px',
                          borderRadius: 'var(--rounded-pill)',
                          backgroundColor: badgeColor.bg,
                          color: badgeColor.text,
                          fontSize: '13px',
                          fontWeight: 600,
                        }}>
                          {project.doc_complete} / {project.doc_total} Complete
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-ink-muted-48)' }}>
                        <ChevronRight size={18} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DokumenMonitoringList;
