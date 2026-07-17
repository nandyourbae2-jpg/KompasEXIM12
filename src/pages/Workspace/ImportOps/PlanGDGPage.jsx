import React from 'react';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import useImportOperationalStore from '../../../store/useImportOperationalStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const computeFreeTime = (eta, freeTimeDest) => {
  if (!eta || !freeTimeDest || Number(freeTimeDest) === 0) return null;
  const etaDate = new Date(eta + 'T00:00:00');
  const freeDate = new Date(etaDate.getTime() + Number(freeTimeDest) * 86400000);
  return freeDate.toISOString().split('T')[0];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const daysDiff = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr + 'T00:00:00') - new Date()) / 86400000);
  return diff;
};

// ─── PlanGDGPage ───────────────────────────────────────────────────────────────

const PlanGDGPage = () => {
  const { shipments } = useImportOperationalStore();

  // Computed on-read: PlanGDG = semua shipment yang belum selesai, diurutkan ETA
  // "Selesai" = gateOutWh sudah terisi di SEMUA kontainer (artinya semua barang sudah masuk gudang)
  const planRows = shipments
    .filter(s => {
      if (!s.containers || s.containers.length === 0) return true;
      return s.containers.some(c => !c.gateOutWh);
    })
    .sort((a, b) => {
      if (!a.eta && !b.eta) return 0;
      if (!a.eta) return 1;
      if (!b.eta) return -1;
      return new Date(a.eta) - new Date(b.eta);
    })
    .map(s => {
      const freeTimeDate = computeFreeTime(s.eta, s.freeTimeDest);
      const freeTimeDays = freeTimeDate ? daysDiff(freeTimeDate) : null;
      const isReady = s.containers?.length > 0 && s.containers.every(c => c.truRepoVendor && c.truWhVendor);

      return {
        id: s.id,
        un: s.un,
        kat: s.kat,
        supplier: s.supplier,
        blSwbAwb: s.blSwbAwb,
        eta: s.eta,
        gudang: s.gudang,
        freeTimeDate,
        freeTimeDays,
        isReady,
        freeTimeDest: s.freeTimeDest,
      };
    });

  // ─── Sub-components ─────────────────────────────────────────────────────────

  const Th = ({ children, right }) => (
    <th style={{
      padding: '12px 16px', textAlign: right ? 'right' : 'left',
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

  const Td = ({ children, right, bold, style: extraStyle }) => (
    <td style={{
      padding: '12px 16px', textAlign: right ? 'right' : 'left',
      fontSize: '13px', fontWeight: bold ? '600' : '400',
      color: 'var(--color-ink)',
      borderBottom: '1px solid var(--color-hairline)',
      whiteSpace: 'nowrap',
      ...extraStyle,
    }}>
      {children}
    </td>
  );

  const KatBadge = ({ kat }) => {
    const map = {
      'RM':        { bg: '#e5f1fc', color: '#0066cc' },
      'Ind. Food': { bg: '#e7f8ec', color: '#34c759' },
      'Ind. Pckg': { bg: '#fff2e0', color: '#ff9500' },
      'Aset':      { bg: '#f3effe', color: '#5856d6' },
      'Misc':      { bg: '#f0f0f0', color: '#7a7a7a' },
    };
    const s = map[kat] || { bg: '#f0f0f0', color: '#7a7a7a' };
    return (
      <span style={{
        backgroundColor: s.bg, color: s.color,
        fontSize: '10px', fontWeight: '700',
        padding: '2px 6px', borderRadius: '999px',
        marginLeft: '6px', whiteSpace: 'nowrap',
      }}>{kat}</span>
    );
  };

  const FreeTimeBadge = ({ date, days }) => {
    if (!date) return <span style={{ color: 'var(--color-ink-muted-48)' }}>—</span>;
    
    let color = 'var(--color-status-success)';
    let bg = 'var(--color-status-success-bg)';
    let icon = <CheckCircle2 size={11} />;
    
    if (days !== null && days <= 3) {
      color = 'var(--color-status-danger)';
      bg = 'var(--color-status-danger-bg)';
      icon = <AlertCircle size={11} />;
    } else if (days !== null && days <= 7) {
      color = 'var(--color-status-warning)';
      bg = 'var(--color-status-warning-bg)';
      icon = <Clock size={11} />;
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '600' }}>{formatDate(date)}</span>
        {days !== null && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontSize: '10px', fontWeight: '700',
            color, backgroundColor: bg,
            padding: '2px 6px', borderRadius: '999px',
          }}>
            {icon}
            {days > 0 ? `${days}h lagi` : days === 0 ? 'Hari ini' : `${Math.abs(days)}h lalu`}
          </span>
        )}
      </div>
    );
  };

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const readyCount = planRows.filter(r => r.isReady).length;
  const urgentCount = planRows.filter(r => r.freeTimeDays !== null && r.freeTimeDays <= 3).length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)' }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px 20px',
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="var(--color-ink-muted-80)" />
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.374px', margin: 0 }}>
                Plan Kedatangan Gudang (GDG)
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', margin: '2px 0 0' }}>
                Dihasilkan otomatis dari Import Operational · {planRows.length} shipment aktif
              </p>
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ padding: '10px 16px', backgroundColor: 'var(--color-status-success-bg)', border: '1px solid var(--color-status-success)', borderRadius: 'var(--rounded-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-status-success)' }}>{readyCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-status-success)', fontWeight: '600' }}>Siap</div>
            </div>
            <div style={{ padding: '10px 16px', backgroundColor: urgentCount > 0 ? 'var(--color-status-danger-bg)' : 'var(--color-canvas-parchment)', border: `1px solid ${urgentCount > 0 ? 'var(--color-status-danger)' : 'var(--color-hairline)'}`, borderRadius: 'var(--rounded-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: urgentCount > 0 ? 'var(--color-status-danger)' : 'var(--color-ink-muted-80)' }}>{urgentCount}</div>
              <div style={{ fontSize: '11px', color: urgentCount > 0 ? 'var(--color-status-danger)' : 'var(--color-ink-muted-48)', fontWeight: '600' }}>Urgent (≤3h)</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        {planRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--color-ink-muted-48)' }}>
            <Calendar size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <div style={{ fontSize: '17px', fontWeight: '600', marginBottom: '8px' }}>Tidak ada shipment aktif</div>
            <div style={{ fontSize: '13px' }}>Tambahkan shipment di Import Operational untuk melihat jadwal kedatangan.</div>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--color-canvas)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 'var(--rounded-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-product)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <Th>ETA (Estimasi Kedatangan)</Th>
                    <Th>UN / Kategori</Th>
                    <Th>Nomor BL / AWB</Th>
                    <Th>Supplier</Th>
                    <Th>Gudang Tujuan</Th>
                    <Th>Free Time Terakhir</Th>
                    <Th>Status Readiness</Th>
                  </tr>
                </thead>
                <tbody>
                  {planRows.map(row => (
                    <tr key={row.id} style={{ transition: 'background-color 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>

                      <Td bold>
                        {row.eta ? (
                          <div>
                            <div>{formatDate(row.eta)}</div>
                            {daysDiff(row.eta) !== null && (
                              <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '2px' }}>
                                {daysDiff(row.eta) > 0 ? `${daysDiff(row.eta)} hari lagi` : daysDiff(row.eta) === 0 ? 'Hari ini' : 'Sudah lewat'}
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </Td>

                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '600' }}>{row.un || '—'}</span>
                          {row.kat && <KatBadge kat={row.kat} />}
                        </div>
                      </Td>

                      <Td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {row.blSwbAwb || '—'}
                      </Td>

                      <Td>{row.supplier || '—'}</Td>

                      <Td>
                        {row.gudang ? (
                          <span style={{
                            backgroundColor: 'var(--color-canvas-parchment)',
                            border: '1px solid var(--color-hairline)',
                            padding: '3px 8px', borderRadius: '999px',
                            fontSize: '12px', fontWeight: '500',
                          }}>{row.gudang}</span>
                        ) : '—'}
                      </Td>

                      <Td>
                        {row.freeTimeDest
                          ? <FreeTimeBadge date={row.freeTimeDate} days={row.freeTimeDays} />
                          : <span style={{ color: 'var(--color-ink-muted-48)', fontSize: '12px' }}>Belum ada Free Time</span>
                        }
                      </Td>

                      <Td>
                        {row.isReady ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-status-success)', fontSize: '12px', fontWeight: '700' }}>
                            <CheckCircle2 size={14} /> Siap
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-ink-muted-48)', fontSize: '12px', fontWeight: '600' }}>
                            <Clock size={14} /> Menunggu Vendor
                          </div>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer note */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)', fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>
              📌 Data ini dihasilkan otomatis dari Import Operational. Edit ETA, BL, Gudang, atau Free Time Destination langsung di halaman Detail Shipment.
              Status "Siap" = Trucking Repo Vendor + Trucking WH Vendor sudah diisi untuk SEMUA kontainer di tab Identitas &amp; Tracking.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanGDGPage;
