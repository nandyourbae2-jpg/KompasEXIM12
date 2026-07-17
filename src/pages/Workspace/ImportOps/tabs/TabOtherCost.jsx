import React from 'react';
import CostSection from '../../../../components/CostSection';
import CostRollup from '../../../../components/CostRollup';
import PaymentBadge from '../../../../components/PaymentBadge';

const Grid7 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px' }}>
    {children}
  </div>
);


const TabOtherCost = ({ shipmentId, costs, updateCost, totals }) => {
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
      <CostSection title="OTHE (Other Cost)" total={totals.otheOtherCost.total} totalLabel="Total Other Cost (+PPN)">
        <Grid7>
          <div><label style={labelSt}>Vendor Name</label><input type="text" value={costs.otheOtherCost.vendorName} onChange={e => up('vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Remark</label><input type="text" value={costs.otheOtherCost.remark} onChange={e => up('remark', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Invoice <PaymentBadge shipmentId={shipmentId} categoryKey="otheOtherCost" /></label><input type="text" value={costs.otheOtherCost.invoice} onChange={e => up('invoice', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>DPP</label><input type="number" value={costs.otheOtherCost.dpp} onChange={e => up('dpp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPN</label><input type="number" value={costs.otheOtherCost.ppn} onChange={e => up('ppn', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>No. FP</label><input type="text" value={costs.otheOtherCost.noFp} onChange={e => up('noFp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>GP No</label><input type="text" value={costs.otheOtherCost.gpNo} onChange={e => up('gpNo', e.target.value)} style={inputSt} /></div>
        </Grid7>
      </CostSection>

      <CostRollup label="LANDED OTHER COST" value={totals.otheOtherCost.landed} />
    </>
  );
};

export default TabOtherCost;
