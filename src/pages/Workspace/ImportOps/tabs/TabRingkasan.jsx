import React, { useState } from 'react';
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

const BreakdownItem = ({ label, total, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas)' }}>
      <div 
        onClick={() => setOpen(!open)}
        style={{ 
          display: 'flex', justifyContent: 'space-between', padding: '12px 16px', 
          cursor: 'pointer', transition: 'background 0.2s',
          backgroundColor: open ? 'var(--color-status-info-bg)' : 'transparent'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-primary)' }}>{open ? '▼' : '▶'}</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{label}</span>
        </div>
        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>
          Rp {fmtRupiah(total)}
        </span>
      </div>
      {open && (
        <div style={{ padding: '8px 16px 12px 36px', backgroundColor: 'var(--color-canvas-parchment)' }}>
          {children}
        </div>
      )}
    </div>
  );
};

const BreakdownSubRow = ({ vendorName, invNo, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--color-hairline)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{vendorName || '—'}</span>
      <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>Inv: {invNo || '—'}</span>
    </div>
    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>Rp {fmtRupiah(value)}</span>
  </div>
);

const EmptySubRow = () => (
  <div style={{ padding: '8px 0', fontSize: '12px', color: 'var(--color-ink-muted-48)', fontStyle: 'italic' }}>
    Tidak ada data
  </div>
);

const TabRingkasan = ({ shipmentId, totals, qtty, containers = [], globalContainerCosts = [] }) => {
  const { jobOrders } = usePaymentStore();

  const getVendorName = (c) => {
    if (c.cost_category === 'DEPO') {
      const cont = containers.find(x => x.id === c.container_id);
      return cont?.depo_route || c.vendor_name || '—';
    }
    return c.vendor_name || '—';
  };

  const renderCostList = (costList) => {
    if (costList.length === 0) return <EmptySubRow />;
    return costList.map((c, i) => (
      <BreakdownSubRow key={i} vendorName={getVendorName(c)} invNo={c.inv_no} value={c.total} />
    ));
  };

  // Group container costs by category module
  const truckingCosts = globalContainerCosts.filter(c => c.cost_category?.startsWith('TRUC'));
  const loloCosts = globalContainerCosts.filter(c => c.cost_category?.startsWith('LOLO'));
  const depoCosts = globalContainerCosts.filter(c => c.cost_category === 'DEPO');
  const lineCosts = globalContainerCosts.filter(c => c.cost_category?.startsWith('Line'));
  const perizinanCosts = globalContainerCosts.filter(c => c.cost_category === 'OTHE (Other Cost)' && c.jenis_cost === 'PERIZINAN');
  const otherCosts = globalContainerCosts.filter(c => c.cost_category === 'OTHE (Other Cost)' && c.jenis_cost === 'OTHER');

  const getSubtotal = (costList) => costList.reduce((sum, c) => sum + (Number(c.total) || 0), 0);

  // Grand total using the already calculated totals
  const totalGrandNew = totals.grandTotal || 0;
  const landedPerKgNew = totals.landedPerKg || 0;

  const syncedJOs = jobOrders.filter(j => j.shipmentId === shipmentId && j.sumber === 'import_operational');
  const totalTertagih = syncedJOs.reduce((acc, jo) => acc + jo.totalInvoice, 0);
  const totalTerbayar = syncedJOs.reduce((acc, jo) => acc + jo.totalPaid, 0);
  const sisa = syncedJOs.reduce((acc, jo) => acc + jo.remainingBalance, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Kolom Kiri: Breakdown Modules */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Module Breakdown</h3>
          <div style={{ border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden' }}>
            
            <BreakdownItem label="TRUCKING" total={getSubtotal(truckingCosts)}>
              {renderCostList(truckingCosts)}
            </BreakdownItem>

            <BreakdownItem label="LOLO" total={getSubtotal(loloCosts)}>
              {renderCostList(loloCosts)}
            </BreakdownItem>

            <BreakdownItem label="DEPO" total={getSubtotal(depoCosts)}>
              {renderCostList(depoCosts)}
            </BreakdownItem>

            <BreakdownItem label="LINE CHARGES" total={getSubtotal(lineCosts)}>
              {renderCostList(lineCosts)}
            </BreakdownItem>

            <BreakdownItem label="PERIZINAN" total={getSubtotal(perizinanCosts)}>
              {renderCostList(perizinanCosts)}
            </BreakdownItem>

            <BreakdownItem label="OTHER COST" total={getSubtotal(otherCosts)}>
              {renderCostList(otherCosts)}
            </BreakdownItem>
          </div>
        </div>

        {/* Kolom Kanan: Grand Total & Per Kg */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Ringkasan Eksekutif</h3>
            <CostRollup label="GRAND TOTAL (+TAX)" value={totalGrandNew} hint="Landed Total + Seluruh Komponen PPN & PPh" isGrand />
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
              Rp {fmtRupiah(landedPerKgNew)}
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
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--color-ink)' }}>{cont.cont || cont.no_kontainer || 'Belum ada nomor'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-ink)' }}>{cont.lamaInapSasis != null ? cont.lamaInapSasis : '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-ink)' }}>{cont.waktuAntri != null ? cont.waktuAntri : '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-ink)' }}>{cont.durasiBongkar != null ? cont.durasiBongkar : '—'}</td>
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
