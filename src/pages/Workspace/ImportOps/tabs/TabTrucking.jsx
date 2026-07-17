import React from 'react';
import CostSection from '../../../../components/CostSection';
import CostRollup from '../../../../components/CostRollup';
import PaymentBadge from '../../../../components/PaymentBadge';

const Grid = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
    {children}
  </div>
);


const TabTrucking = ({ shipmentId, costs, updateCost, totals }) => {
  const up = (cat, field, val) => updateCost(cat, field, val);

  const inputSt = {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-sm)',
    fontSize: '13px', fontFamily: 'var(--font-family-body)',
    outline: 'none', backgroundColor: 'var(--color-canvas)',
    color: 'var(--color-ink)', boxSizing: 'border-box',
  };

  const autoSt = {
    ...inputSt,
    backgroundColor: 'var(--color-canvas-parchment)',
    color: 'var(--color-ink-muted-80)',
    cursor: 'not-allowed',
  };

  const labelSt = {
    display: 'block', fontSize: '13px', fontWeight: '600',
    color: 'var(--color-ink)', marginBottom: '5px',
  };

  return (
    <>
      <CostSection title="TRUC (Repo Depo)" total={totals.trucRepo.total} totalLabel="Total TRUC (Repo) [+PPN]">
        <Grid>
          <div>
            <label style={labelSt}>No. Inv Repo <PaymentBadge shipmentId={shipmentId} categoryKey="trucRepo" /></label>
            <input type="text" value={costs.trucRepo.noInvRepo} onChange={e => up('trucRepo', 'noInvRepo', e.target.value)} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>DPP</label>
            <input type="number" value={costs.trucRepo.dpp} onChange={e => up('trucRepo', 'dpp', e.target.value)} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>% PPN</label>
            <input type="number" value={costs.trucRepo.pctPpn} onChange={e => up('trucRepo', 'pctPpn', e.target.value)} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>PPN</label>
            <input type="text" value={totals.trucRepo.ppn} readOnly style={autoSt} />
          </div>
          <div>
            <label style={labelSt}>No. FP</label>
            <input type="text" value={costs.trucRepo.noFp} onChange={e => up('trucRepo', 'noFp', e.target.value)} style={inputSt} />
          </div>
        </Grid>
      </CostSection>

      <CostSection title="TRUC (Warehouse)" total={totals.trucWh.total} totalLabel="Total TRUC (WH) [+PPN]">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelSt}>No. Inv Truk <PaymentBadge shipmentId={shipmentId} categoryKey="trucWh" /></label>
            <input type="text" value={costs.trucWh.noInvTruk} onChange={e => up('trucWh', 'noInvTruk', e.target.value)} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Biaya Dasar</label>
            <input type="number" value={costs.trucWh.biayaDasar} onChange={e => up('trucWh', 'biayaDasar', e.target.value)} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Inap Sasis</label>
            <input type="number" value={costs.trucWh.inapSasis} onChange={e => up('trucWh', 'inapSasis', e.target.value)} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Other Cost</label>
            <input type="number" value={costs.trucWh.other} onChange={e => up('trucWh', 'other', e.target.value)} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Keterangan Other</label>
            <input type="text" value={costs.trucWh.otherNotes} onChange={e => up('trucWh', 'otherNotes', e.target.value)} style={inputSt} />
          </div>
        </div>

        <Grid>
          <div>
            <label style={labelSt}>DPP</label>
            <input type="text" value={totals.trucWh.dpp} readOnly style={autoSt} />
          </div>
          <div>
            <label style={labelSt}>% PPN</label>
            <input type="number" value={costs.trucWh.pctPpn} onChange={e => up('trucWh', 'pctPpn', e.target.value)} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>PPN</label>
            <input type="text" value={totals.trucWh.ppn} readOnly style={autoSt} />
          </div>
          <div>
            <label style={labelSt}>No. FP</label>
            <input type="text" value={costs.trucWh.noFp} onChange={e => up('trucWh', 'noFp', e.target.value)} style={inputSt} />
          </div>
        </Grid>
      </CostSection>

      <CostRollup label="TRUC LANDED" value={totals.truc.landed} hint="DPP (Repo + Warehouse)" />
      <CostRollup label="TOTAL TRUC (+TAX)" value={totals.truc.total} hint="TRUC Landed + Seluruh PPN" isGrand />
    </>
  );
};

export default TabTrucking;
