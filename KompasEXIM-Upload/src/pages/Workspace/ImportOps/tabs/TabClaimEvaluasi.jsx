import React from 'react';
import CostSection from '../../../../components/CostSection';
import CostRollup from '../../../../components/CostRollup';
import PaymentBadge from '../../../../components/PaymentBadge';
import { fmtRupiah } from '../../../../utils/importCalc';

const Grid = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
    {children}
  </div>
);

const Grid6 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
    {children}
  </div>
);

const Grid5 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
    {children}
  </div>
);


const TabClaimEvaluasi = ({ shipmentId, costs, updateCost, totals, qtty }) => {
  const up = (cat, field, val) => updateCost(cat, field, val);

  const inputSt = {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-sm)',
    fontSize: '13px', fontFamily: 'var(--font-family-body)',
    outline: 'none', backgroundColor: 'var(--color-canvas)',
    color: 'var(--color-ink)', boxSizing: 'border-box',
  };

  const labelSt = {
    display: 'block', fontSize: '13px', fontWeight: '600',
    color: 'var(--color-ink)', marginBottom: '5px',
  };

  return (
    <>
      <CostSection title="CLAIM" total={totals.claim.total} totalLabel="Total Claim Amount">
        <Grid>
          <div><label style={labelSt}>Claim Supplier Vendor</label><input type="text" value={costs.claimSupplier.vendorName} onChange={e => up('claimSupplier', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Claim Supplier Detail <PaymentBadge shipmentId={shipmentId} categoryKey="claimSupplier" /></label><input type="text" value={costs.claimSupplier.detail} onChange={e => up('claimSupplier', 'detail', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Amount (IDR)</label><input type="number" value={costs.claimSupplier.amount} onChange={e => up('claimSupplier', 'amount', e.target.value)} style={inputSt} /></div>
          <div>
            <label style={labelSt}>Status Klaim</label>
            <select value={costs.claimSupplier.status_klaim || 'Belum Diterima'} onChange={e => up('claimSupplier', 'status_klaim', e.target.value)} style={inputSt}>
              <option value="Belum Diterima">Belum Diterima</option>
              <option value="Diterima">Diterima</option>
            </select>
          </div>
        </Grid>
        <div style={{ margin: '16px 0' }} />
        <Grid>
          <div><label style={labelSt}>Claim Liner/FWD Vendor</label><input type="text" value={costs.claimLinerFwd.vendorName} onChange={e => up('claimLinerFwd', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Claim Liner/FWD Detail <PaymentBadge shipmentId={shipmentId} categoryKey="claimLinerFwd" /></label><input type="text" value={costs.claimLinerFwd.detail} onChange={e => up('claimLinerFwd', 'detail', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Amount (IDR)</label><input type="number" value={costs.claimLinerFwd.amount} onChange={e => up('claimLinerFwd', 'amount', e.target.value)} style={inputSt} /></div>
          <div>
            <label style={labelSt}>Status Klaim</label>
            <select value={costs.claimLinerFwd.status_klaim || 'Belum Diterima'} onChange={e => up('claimLinerFwd', 'status_klaim', e.target.value)} style={inputSt}>
              <option value="Belum Diterima">Belum Diterima</option>
              <option value="Diterima">Diterima</option>
            </select>
          </div>
        </Grid>
        <div style={{ margin: '16px 0' }} />
        <Grid>
          <div><label style={labelSt}>Claim Trucking Vendor</label><input type="text" value={costs.claimTrucking.vendorName} onChange={e => up('claimTrucking', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Claim Trucking Detail <PaymentBadge shipmentId={shipmentId} categoryKey="claimTrucking" /></label><input type="text" value={costs.claimTrucking.detail} onChange={e => up('claimTrucking', 'detail', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Amount (IDR)</label><input type="number" value={costs.claimTrucking.amount} onChange={e => up('claimTrucking', 'amount', e.target.value)} style={inputSt} /></div>
          <div>
            <label style={labelSt}>Status Klaim</label>
            <select value={costs.claimTrucking.status_klaim || 'Belum Diterima'} onChange={e => up('claimTrucking', 'status_klaim', e.target.value)} style={inputSt}>
              <option value="Belum Diterima">Belum Diterima</option>
              <option value="Diterima">Diterima</option>
            </select>
          </div>
        </Grid>
      </CostSection>

      <CostRollup label="TOTAL BEBAN PBN / KG" value={totals.claim.bebanPbnKg} hint={`Beban PBN (Rp ${fmtRupiah(totals.claim.bebanPbn)}) / Qtty (${qtty})`} />

      <CostSection title="EVALUASI TILA">
        <Grid6>
          <div><label style={labelSt}>Standard</label><input type="number" value={costs.evaluasiTila.standard} onChange={e => up('evaluasiTila', 'standard', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Actual</label><input type="number" value={costs.evaluasiTila.actual} onChange={e => up('evaluasiTila', 'actual', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Extend</label><input type="number" value={costs.evaluasiTila.extend} onChange={e => up('evaluasiTila', 'extend', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Result</label><input type="text" value={costs.evaluasiTila.result} onChange={e => up('evaluasiTila', 'result', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Difference</label><input type="number" value={costs.evaluasiTila.difference} onChange={e => up('evaluasiTila', 'difference', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Reason</label><input type="text" value={costs.evaluasiTila.reason} onChange={e => up('evaluasiTila', 'reason', e.target.value)} style={inputSt} /></div>
        </Grid6>
      </CostSection>

      <CostSection title="GP RECEIPT">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div><label style={labelSt}>GP Receipt Number</label><input type="text" value={costs.gpReceipt.gpReceiptNumber} onChange={e => up('gpReceipt', 'gpReceiptNumber', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Latest Rcv Date</label><input type="date" value={costs.gpReceipt.latestRcvDate || ''} onChange={e => up('gpReceipt', 'latestRcvDate', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Proc/Purc Save Date</label><input type="date" value={costs.gpReceipt.procPurcSaveDate || ''} onChange={e => up('gpReceipt', 'procPurcSaveDate', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Lnd Cost Post Date</label><input type="date" value={costs.gpReceipt.lndCostPostDate || ''} onChange={e => up('gpReceipt', 'lndCostPostDate', e.target.value)} style={inputSt} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div><label style={labelSt}>Result Proc/Purc</label><input type="text" value={costs.gpReceipt.resultProcPurc} onChange={e => up('gpReceipt', 'resultProcPurc', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Result Imp Team</label><input type="text" value={costs.gpReceipt.resultImpTeam} onChange={e => up('gpReceipt', 'resultImpTeam', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Reason</label><input type="text" value={costs.gpReceipt.reason} onChange={e => up('gpReceipt', 'reason', e.target.value)} style={inputSt} /></div>
        </div>
      </CostSection>

      <CostSection title="Operational Cost Evaluation">
        <Grid5>
          <div><label style={labelSt}>No. Skep S.shp/Reimp</label><input type="text" value={costs.opCostEval.noSkepSshpReimp} onChange={e => up('opCostEval', 'noSkepSshpReimp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>No. Hico</label><input type="text" value={costs.opCostEval.noHico} onChange={e => up('opCostEval', 'noHico', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>No. TKBM Bahandel</label><input type="text" value={costs.opCostEval.noTkbmBahandel} onChange={e => up('opCostEval', 'noTkbmBahandel', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>No. Surveyor</label><input type="text" value={costs.opCostEval.noSurveyor} onChange={e => up('opCostEval', 'noSurveyor', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>No. Kawalan</label><input type="text" value={costs.opCostEval.noKawalan} onChange={e => up('opCostEval', 'noKawalan', e.target.value)} style={inputSt} /></div>
        </Grid5>
      </CostSection>
    </>
  );
};

export default TabClaimEvaluasi;
