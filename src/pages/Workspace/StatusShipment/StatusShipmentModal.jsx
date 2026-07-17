import React from 'react';
import { X, Truck, CheckCircle2, DollarSign, Clock, Anchor, FileText } from 'lucide-react';
import { fmtRupiah } from '../../../utils/importCalc';

const StatusShipmentModal = ({ shipment, jobOrders, onClose, stage }) => {
  if (!shipment) return null;

  const { identity, costs, containers } = shipment;

  // Renderers for different stages
  const renderShipmentActive = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginBottom: '4px' }}>UN IMP</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{shipment.un}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginBottom: '4px' }}>Supplier</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{shipment.supplier}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginBottom: '4px' }}>No Invoice</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{shipment.inv || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginBottom: '4px' }}>No B/L</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{shipment.blSwbAwb || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginBottom: '4px' }}>Total Container</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{containers.length}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginBottom: '4px' }}>ETA</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{shipment.eta ? new Date(shipment.eta).toLocaleDateString('id-ID') : '—'}</div>
        </div>
      </div>
      <div style={{ padding: '16px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>
        Menunggu kedatangan kapal (ATA). Silakan isi ATA di tab Identitas pada modul Import Operational.
      </div>
    </div>
  );

  const renderDeliveryActive = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>Progress per Kontainer</div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)' }}>No. Kontainer</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)' }}>Stack</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)' }}>Gate Out</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)' }}>Offloading</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)' }}>Gate Out WH</th>
            </tr>
          </thead>
          <tbody>
            {containers.map((c, i) => (
              <tr key={i} style={{ backgroundColor: c.gateOutWh ? 'var(--color-status-success-bg)' : 'var(--color-canvas)' }}>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '600' }}>{c.cont || `Container ${i+1}`}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-hairline)' }}>{c.stack ? '✅' : '⏳'}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-hairline)' }}>{c.gateOut ? '✅' : '⏳'}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-hairline)' }}>{c.offlEnd ? '✅' : '⏳'}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-hairline)', color: c.gateOutWh ? 'var(--color-status-success)' : 'inherit', fontWeight: c.gateOutWh ? '600' : 'normal' }}>
                  {c.gateOutWh ? '✅ Sudah' : '⏳ Belum'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFinancialSettlement = () => {
    const totalHutang = jobOrders.reduce((sum, jo) => sum + jo.totalInvoice, 0);
    const totalDibayar = jobOrders.reduce((sum, jo) => sum + (jo.totalInvoice - jo.remainingBalance), 0);
    const sisaHutang = jobOrders.reduce((sum, jo) => sum + jo.remainingBalance, 0);

    const claims = [
      costs?.claimSupplier,
      costs?.claimLinerFwd,
      costs?.claimTrucking
    ].filter(c => c && Number(c.amount) > 0);

    const totalPiutang = claims.reduce((sum, c) => sum + Number(c.amount), 0);
    const piutangDiterima = claims.filter(c => c.status_klaim === 'Diterima').reduce((sum, c) => sum + Number(c.amount), 0);
    const sisaPiutang = totalPiutang - piutangDiterima;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '12px' }}>Ringkasan Hutang (Job Orders)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Total Hutang</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>Rp {fmtRupiah(totalHutang)}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-status-success-bg)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-status-success)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-status-success)', marginBottom: '4px' }}>Sudah Dibayar</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-status-success)' }}>Rp {fmtRupiah(totalDibayar)}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: sisaHutang > 0 ? 'var(--color-status-warning-bg)' : 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', border: sisaHutang > 0 ? '1px solid var(--color-status-warning)' : '1px solid var(--color-hairline)' }}>
              <div style={{ fontSize: '12px', color: sisaHutang > 0 ? 'var(--color-status-warning)' : 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Sisa Hutang</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: sisaHutang > 0 ? 'var(--color-status-warning)' : 'var(--color-ink)' }}>Rp {fmtRupiah(sisaHutang)}</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '12px' }}>Ringkasan Piutang (Klaim)</div>
          {claims.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Total Piutang</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Rp {fmtRupiah(totalPiutang)}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--color-status-success-bg)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-status-success)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-status-success)', marginBottom: '4px' }}>Sudah Diterima</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-status-success)' }}>Rp {fmtRupiah(piutangDiterima)}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: sisaPiutang > 0 ? 'var(--color-status-danger-bg)' : 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', border: sisaPiutang > 0 ? '1px solid var(--color-status-danger)' : '1px solid var(--color-hairline)' }}>
                <div style={{ fontSize: '12px', color: sisaPiutang > 0 ? 'var(--color-status-danger)' : 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Belum Diterima</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: sisaPiutang > 0 ? 'var(--color-status-danger)' : 'var(--color-ink)' }}>Rp {fmtRupiah(sisaPiutang)}</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>
              Tidak ada klaim untuk shipment ini.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStatusComplete = () => {
    // Cari container pertama (ETA/ATA) dan kontainer terakhir (GateOutWh)
    const start = shipment.ata ? new Date(shipment.ata) : (shipment.eta ? new Date(shipment.eta) : null);
    
    // Temukan gate out wh paling akhir
    let lastGateOutWh = null;
    containers.forEach(c => {
      if (c.gateOutWh) {
        const d = new Date(c.gateOutWh);
        if (!lastGateOutWh || d > lastGateOutWh) {
          lastGateOutWh = d;
        }
      }
    });

    let durasiDays = '—';
    if (start && lastGateOutWh) {
      const diffTime = Math.abs(lastGateOutWh - start);
      durasiDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Biaya total (ini asumsi menggunakan kalkulasi jika ada, tapi karena ini display kita hanya sediakan dummy atau call importCalc, tapi kita tidak hitung grandTotal di sini secara full, kita tampilkan placeholder atau butuh import calcTotals).
    // Lebih baik kita ambil dari shipment.calculatedTotals jika ada, atau kita import calcTotals
    // Tapi karena importCalc calcTotals diexport, kita bisa memakainya:
    // ... wait, let's just use what's passed or available. 

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', backgroundColor: 'var(--color-status-success-bg)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-status-success)' }}>
          <CheckCircle2 size={32} color="var(--color-status-success)" />
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-status-success)' }}>Shipment Selesai</div>
            <div style={{ fontSize: '13px', color: 'var(--color-status-success)' }}>Seluruh proses logistik dan finansial telah rampung.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Total Durasi (ATA → Last Gate Out WH)</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-ink)' }}>{durasiDays} <span style={{ fontSize: '14px', fontWeight: '400' }}>Hari</span></div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Total Kontainer Diselesaikan</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-ink)' }}>{containers.length}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
    }}>
      <div style={{
        width: '700px', maxHeight: '90vh', overflowY: 'auto',
        backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)',
        display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-product)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-hairline)', position: 'sticky', top: 0, backgroundColor: 'var(--color-canvas)', zIndex: 1 }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600', color: 'var(--color-ink)' }}>
              Detail Status: {shipment.un}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600' }}>{stage}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-48)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {stage === 'Shipment Active' && renderShipmentActive()}
          {stage === 'Delivery Active' && renderDeliveryActive()}
          {stage === 'Financial Settlement' && renderFinancialSettlement()}
          {stage === 'Status Complete' && renderStatusComplete()}
        </div>
      </div>
    </div>
  );
};

export default StatusShipmentModal;
