import React from 'react';
import { fmtRupiah } from '../../../../utils/importCalc';
import CostRollup from '../../../../components/CostRollup';
import usePaymentStore from '../../../../store/usePaymentStore';

const Row = ({ label, value, isBold }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-hairline)',
    backgroundColor: 'var(--color-canvas)',
  }}>
    <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: isBold ? '700' : '400', color: 'var(--color-ink)' }}>
      Rp {fmtRupiah(value)}
    </span>
  </div>
);


const TabRingkasan = ({ shipmentId, totals, qtty, containers = [] }) => {
  const { jobOrders } = usePaymentStore();
  
  // Hitung total dari JO yang terhubung dengan shipment ini
  const syncedJOs = jobOrders.filter(j => j.shipmentId === shipmentId && j.sumber === 'import_operational');
  const totalTertagih = syncedJOs.reduce((acc, jo) => acc + jo.totalInvoice, 0);
  const totalTerbayar = syncedJOs.reduce((acc, jo) => acc + jo.totalPaid, 0);
  const sisa = syncedJOs.reduce((acc, jo) => acc + jo.remainingBalance, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      {/* Kolom Kiri: Breakdown Landed Cost */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Breakdown Landed Cost</h3>
        <div style={{ border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden' }}>
          <Row label="TRUC Landed (Repo + WH)" value={totals.truc.landed} />
          <Row label="LOLO Reimb. Landed" value={totals.loloReimb.landed} />
          <Row label="DEPO Landed" value={totals.depo.landed} />
          <Row label="OTHE Perizinan (DPP)" value={totals.othePerizinan.total} /> {/* Assuming amount + vat or just amount? We used total in calc */}
          <Row label="LINE Landed" value={totals.line.total} />
          <Row label="OTHE PIB Landed" value={totals.othePib.landed} />
          <Row label="LOLO Port & Warehouse Landed" value={totals.lolo.landed} />
          <Row label="OTHE Other Cost Landed" value={totals.otheOtherCost.landed} />
          
          <div style={{ backgroundColor: 'var(--color-status-info-bg)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-primary)' }}>TOTAL LANDED COST (TANPA PAJAK)</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-primary)' }}>Rp {fmtRupiah(totals.landedTotal)}</span>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Grand Total & Per Kg */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Ringkasan Eksekutif</h3>
          <CostRollup label="GRAND TOTAL (+TAX)" value={totals.grandTotal} hint="Landed Total + Seluruh Komponen PPN & PPh" isGrand />
        </div>

        <div style={{
          backgroundColor: 'var(--color-canvas)',
          border: '1px solid var(--color-hairline)',
          borderRadius: 'var(--rounded-lg)',
          padding: '24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-product)',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Landed per Kg
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-primary)' }}>
            Rp {fmtRupiah(totals.landedPerKg)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', marginTop: '8px' }}>
            Grand Total dibagi Qtty ({qtty})
          </div>
        </div>

        {/* Status Pembayaran */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Status Pembayaran (Disinkronisasi)</h3>
          <div style={{ border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden' }}>
            <Row label="Total Tertagih" value={totalTertagih} isBold />
            <Row label="Total Terbayar" value={totalTerbayar} />
            <div style={{ backgroundColor: 'var(--color-status-warning-bg)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-status-warning)' }}>SISA TAGIHAN</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-status-warning)' }}>Rp {fmtRupiah(sisa)}</span>
            </div>
          </div>
        </div>

      </div>
      </div>

      {/* Tabel Ringkasan Kontainer */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Ringkasan Waktu Operasional (Per Kontainer)</h3>
        <div style={{ border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden', backgroundColor: 'var(--color-canvas)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-canvas-parchment)' }}>
                {['No. Kontainer', 'Lama Inap Sasis (Jam)', 'Waktu Antri (Jam)', 'Durasi Bongkar (Jam)', 'Isu Operasional'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: '11px', fontWeight: '600',
                    color: 'var(--color-ink-muted-48)',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    borderBottom: '1px solid var(--color-hairline)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {containers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
                    Tidak ada data kontainer
                  </td>
                </tr>
              )}
              {containers.map((cont, i) => {
                const issues = [];
                if (cont.fishIssue) issues.push('Fish');
                if (cont.queueIssue) issues.push('Queue');
                if (cont.spaceIssue) issues.push('Space');
                if (cont.otherIssue) issues.push('Other');

                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--color-ink)' }}>{cont.cont || 'Belum ada nomor'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-ink)' }}>{cont.lamaInapSasis !== null ? cont.lamaInapSasis : '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-ink)' }}>{cont.waktuAntri !== null ? cont.waktuAntri : '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-ink)' }}>{cont.durasioBongkar !== null ? cont.durasioBongkar : '—'}</td>
                    <td style={{ padding: '12px 14px', color: issues.length > 0 ? 'var(--color-status-danger)' : 'var(--color-ink-muted-48)' }}>
                      {issues.length > 0 ? issues.join(', ') : 'Tidak ada'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TabRingkasan;
