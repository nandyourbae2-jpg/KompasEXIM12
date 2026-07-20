import React from 'react';
import CostSection from '../../../../components/CostSection';
import CostRollup from '../../../../components/CostRollup';
import PaymentBadge from '../../../../components/PaymentBadge';

const Grid5 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '16px' }}>
    {children}
  </div>
);

const Grid4 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
    {children}
  </div>
);


const TabDepo = ({ shipmentId, costs, updateCost, totals }) => {
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
      <CostSection title="DEPO" total={totals.depo.total} totalLabel="Total Depo (+PPN)">
        <Grid4>
          <div><label style={labelSt}>Calc (Day)</label><input type="number" value={costs.depo.calcDay} onChange={e => up('depo', 'calcDay', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Calc (Shift)</label><input type="number" value={costs.depo.calcShift} onChange={e => up('depo', 'calcShift', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Act (Day)</label><input type="number" value={costs.depo.actDay} onChange={e => up('depo', 'actDay', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Act (Shift)</label><input type="number" value={costs.depo.actShift} onChange={e => up('depo', 'actShift', e.target.value)} style={inputSt} /></div>
        </Grid4>

        <div style={{ borderBottom: '1px dashed var(--color-hairline)', margin: '16px 0' }} />

        <Grid5>
          <div><label style={labelSt}>No. Inv Depo <PaymentBadge shipmentId={shipmentId} categoryKey="depo" /></label><input type="text" value={costs.depo.noInvDepo} onChange={e => up('depo', 'noInvDepo', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Storage</label><input type="number" value={costs.depo.storage} onChange={e => up('depo', 'storage', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Monitoring</label><input type="number" value={costs.depo.monitoring} onChange={e => up('depo', 'monitoring', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Recooling</label><input type="number" value={costs.depo.recooling} onChange={e => up('depo', 'recooling', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>LoLo</label><input type="number" value={costs.depo.lolo} onChange={e => up('depo', 'lolo', e.target.value)} style={inputSt} /></div>
        </Grid5>

        <Grid5>
          <div><label style={labelSt}>DPP (Auto)</label><input type="text" value={totals.depo.dpp} readOnly style={autoSt} /></div>
          <div><label style={labelSt}>% PPN</label><input type="number" value={costs.depo.pctPpn} onChange={e => up('depo', 'pctPpn', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPN (Auto)</label><input type="text" value={totals.depo.ppn} readOnly style={autoSt} /></div>
          <div><label style={labelSt}>No. FP</label><input type="text" value={costs.depo.noFp} onChange={e => up('depo', 'noFp', e.target.value)} style={inputSt} /></div>
        </Grid5>
      </CostSection>

      <CostRollup label="DEPO LANDED" value={totals.depo.landed} />
    </>
  );
};

export default TabDepo;
