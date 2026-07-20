import React from 'react';
import CostSection from '../../../../components/CostSection';
import CostRollup from '../../../../components/CostRollup';
import PaymentBadge from '../../../../components/PaymentBadge';

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

const Grid4 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
    {children}
  </div>
);

const Grid7 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px' }}>
    {children}
  </div>
);


const TabLinePerizinan = ({ shipmentId, costs, updateCost, totals }) => {
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
      <CostSection title="OTHE (Perizinan)" total={totals.othePerizinan.total} totalLabel="Total OTHE Perizinan (+PPN)">
        <Grid7>
          <div><label style={labelSt}>Vendor Name</label><input type="text" value={costs.othePerizinan.vendorName} onChange={e => up('othePerizinan', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Inv No <PaymentBadge shipmentId={shipmentId} categoryKey="othePerizinan" /></label><input type="text" value={costs.othePerizinan.invNo} onChange={e => up('othePerizinan', 'invNo', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Category</label><input type="text" value={costs.othePerizinan.category} onChange={e => up('othePerizinan', 'category', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Amount (DPP)</label><input type="number" value={costs.othePerizinan.amount} onChange={e => up('othePerizinan', 'amount', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>VAT (PPN)</label><input type="number" value={costs.othePerizinan.vat} onChange={e => up('othePerizinan', 'vat', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>FP</label><input type="text" value={costs.othePerizinan.fp} onChange={e => up('othePerizinan', 'fp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>GP No</label><input type="text" value={costs.othePerizinan.gpNo} onChange={e => up('othePerizinan', 'gpNo', e.target.value)} style={inputSt} /></div>
        </Grid7>
      </CostSection>

      <CostSection title="LINE (Freight & Local Charges Origin)">
        <Grid7>
          <div><label style={labelSt}>Vendor Name</label><input type="text" value={costs.lineFreight.vendorName} onChange={e => up('lineFreight', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Inv No <PaymentBadge shipmentId={shipmentId} categoryKey="lineFreight" /></label><input type="text" value={costs.lineFreight.invNo} onChange={e => up('lineFreight', 'invNo', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>DPP</label><input type="number" value={costs.lineFreight.dpp} onChange={e => up('lineFreight', 'dpp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>% PPN</label><input type="number" value={costs.lineFreight.pctPpn} onChange={e => up('lineFreight', 'pctPpn', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPN (Auto)</label><input type="text" value={totals.line.freightPpn} readOnly style={autoSt} /></div>
          <div><label style={labelSt}>FP</label><input type="text" value={costs.lineFreight.noFp} onChange={e => up('lineFreight', 'noFp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>GP No</label><input type="text" value={costs.lineFreight.noGp} onChange={e => up('lineFreight', 'noGp', e.target.value)} style={inputSt} /></div>
        </Grid7>
      </CostSection>

      <CostSection title="LINE (Local Charges Indonesia)">
        <Grid7>
          <div><label style={labelSt}>Vendor Name</label><input type="text" value={costs.lineLocalIdn.vendorName} onChange={e => up('lineLocalIdn', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Inv No <PaymentBadge shipmentId={shipmentId} categoryKey="lineLocalIdn" /></label><input type="text" value={costs.lineLocalIdn.invNo} onChange={e => up('lineLocalIdn', 'invNo', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>DPP</label><input type="number" value={costs.lineLocalIdn.dpp} onChange={e => up('lineLocalIdn', 'dpp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>% PPN</label><input type="number" value={costs.lineLocalIdn.pctPpn} onChange={e => up('lineLocalIdn', 'pctPpn', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPN (Auto)</label><input type="text" value={totals.line.localIdnPpn} readOnly style={autoSt} /></div>
          <div><label style={labelSt}>FP</label><input type="text" value={costs.lineLocalIdn.noFp} onChange={e => up('lineLocalIdn', 'noFp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>GP No</label><input type="text" value={costs.lineLocalIdn.noGp} onChange={e => up('lineLocalIdn', 'noGp', e.target.value)} style={inputSt} /></div>
        </Grid7>
      </CostSection>

      <CostSection title="LINE (Extend DO / Demdet)">
        <Grid7>
          <div><label style={labelSt}>Vendor Name</label><input type="text" value={costs.lineExtendDO.vendorName} onChange={e => up('lineExtendDO', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Inv No <PaymentBadge shipmentId={shipmentId} categoryKey="lineExtendDO" /></label><input type="text" value={costs.lineExtendDO.invNo} onChange={e => up('lineExtendDO', 'invNo', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>DPP</label><input type="number" value={costs.lineExtendDO.dpp} onChange={e => up('lineExtendDO', 'dpp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>% PPN</label><input type="number" value={costs.lineExtendDO.pctPpn} onChange={e => up('lineExtendDO', 'pctPpn', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPN (Auto)</label><input type="text" value={totals.line.extendDOPpn} readOnly style={autoSt} /></div>
          <div><label style={labelSt}>FP</label><input type="text" value={costs.lineExtendDO.noFp} onChange={e => up('lineExtendDO', 'noFp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>GP No</label><input type="text" value={costs.lineExtendDO.noGp} onChange={e => up('lineExtendDO', 'noGp', e.target.value)} style={inputSt} /></div>
        </Grid7>
      </CostSection>

      <CostRollup label="TOTAL LINE LANDED" value={totals.line.total} hint="DPP Freight + Local IDN + Extend DO" />
      <CostRollup label="TOTAL LINE (+TAX)" value={totals.line.totalPpn} isGrand />

      <CostSection title="OTHE (PIB)">
        <Grid6>
          <div><label style={labelSt}>Vendor Name</label><input type="text" value={costs.othePib.vendorName} onChange={e => up('othePib', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>No. Aju PIB <PaymentBadge shipmentId={shipmentId} categoryKey="othePib" /></label><input type="text" value={costs.othePib.noAjuPib} onChange={e => up('othePib', 'noAjuPib', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Bea Masuk</label><input type="number" value={costs.othePib.beaMasuk} onChange={e => up('othePib', 'beaMasuk', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPN</label><input type="number" value={costs.othePib.ppn} onChange={e => up('othePib', 'ppn', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPh</label><input type="number" value={costs.othePib.pph} onChange={e => up('othePib', 'pph', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>GP No</label><input type="text" value={costs.othePib.gpNo} onChange={e => up('othePib', 'gpNo', e.target.value)} style={inputSt} /></div>
        </Grid6>
      </CostSection>

      <CostSection title="OTHE (Customs Bond)">
        <Grid5>
          <div><label style={labelSt}>Vendor Name</label><input type="text" value={costs.otheCustomsBond.vendorName} onChange={e => up('otheCustomsBond', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>No. Inv CB <PaymentBadge shipmentId={shipmentId} categoryKey="otheCustomsBond" /></label><input type="text" value={costs.otheCustomsBond.noInvCb} onChange={e => up('otheCustomsBond', 'noInvCb', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>DPP</label><input type="number" value={costs.otheCustomsBond.dpp} onChange={e => up('otheCustomsBond', 'dpp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Diskon</label><input type="number" value={costs.otheCustomsBond.diskon} onChange={e => up('otheCustomsBond', 'diskon', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>GP No</label><input type="text" value={costs.otheCustomsBond.gpNo} onChange={e => up('otheCustomsBond', 'gpNo', e.target.value)} style={inputSt} /></div>
        </Grid5>
      </CostSection>

      <CostRollup label="TOTAL OTHE PIB LANDED" value={totals.othePib.landed} hint="Bea Masuk + (DPP CB - Diskon)" />
      <CostRollup label="TOTAL OTHE PIB (+TAX+PPH)" value={totals.othePib.total} isGrand />

    </>
  );
};

export default TabLinePerizinan;
