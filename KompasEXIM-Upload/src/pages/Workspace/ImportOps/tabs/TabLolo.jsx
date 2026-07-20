import React from 'react';
import CostSection from '../../../../components/CostSection';
import CostRollup from '../../../../components/CostRollup';
import PaymentBadge from '../../../../components/PaymentBadge';

const Grid = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
    {children}
  </div>
);

const Grid6 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
    {children}
  </div>
);


const TabLolo = ({ shipmentId, costs, updateCost, totals }) => {
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
      <CostSection title="LOLO (Reimb. Lift Off Empty)" total={totals.loloReimb.subtotalLiftoff} totalLabel="Subtotal Liftoff">
        <Grid>
          <div><label style={labelSt}>No. Reimb</label><input type="text" value={costs.loloReimb.noReimbLiftoff} onChange={e => up('loloReimb', 'noReimbLiftoff', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>No. Inv Liftoff <PaymentBadge shipmentId={shipmentId} categoryKey="loloReimbLiftoff" /></label><input type="text" value={costs.loloReimb.noInvLiftoff} onChange={e => up('loloReimb', 'noInvLiftoff', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>DPP</label><input type="number" value={costs.loloReimb.dppLiftoff} onChange={e => up('loloReimb', 'dppLiftoff', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPN</label><input type="number" value={costs.loloReimb.ppnLiftoff} onChange={e => up('loloReimb', 'ppnLiftoff', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>No. FP</label><input type="text" value={costs.loloReimb.noFpLiftoff} onChange={e => up('loloReimb', 'noFpLiftoff', e.target.value)} style={inputSt} /></div>
        </Grid>
      </CostSection>

      <CostSection title="LOLO (Reimb. Repair)" total={totals.loloReimb.subtotalRepair} totalLabel="Subtotal Repair">
        <Grid>
          <div><label style={labelSt}>No. Reimb</label><input type="text" value={costs.loloReimb.noReimbRepair} onChange={e => up('loloReimb', 'noReimbRepair', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>No. Inv Repair <PaymentBadge shipmentId={shipmentId} categoryKey="loloReimbRepair" /></label><input type="text" value={costs.loloReimb.noInvRepair} onChange={e => up('loloReimb', 'noInvRepair', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>DPP</label><input type="number" value={costs.loloReimb.dppRepair} onChange={e => up('loloReimb', 'dppRepair', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPN</label><input type="number" value={costs.loloReimb.ppnRepair} onChange={e => up('loloReimb', 'ppnRepair', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>No. FP</label><input type="text" value={costs.loloReimb.noFpRepair} onChange={e => up('loloReimb', 'noFpRepair', e.target.value)} style={inputSt} /></div>
        </Grid>
      </CostSection>

      <CostRollup label="LOLO (REIMB) LANDED" value={totals.loloReimb.landed} hint="DPP Liftoff + Repair" />
      <CostRollup label="TOTAL REIMB (+TAX)" value={totals.loloReimb.total} isGrand />

      <CostSection title="LOLO (Port)">
        <Grid6>
          <div><label style={labelSt}>Vendor Name</label><input type="text" value={costs.loloPort.vendorName} onChange={e => up('loloPort', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Inv No <PaymentBadge shipmentId={shipmentId} categoryKey="loloPort" /></label><input type="text" value={costs.loloPort.invNo} onChange={e => up('loloPort', 'invNo', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>DPP</label><input type="number" value={costs.loloPort.dpp} onChange={e => up('loloPort', 'dpp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPN</label><input type="number" value={costs.loloPort.ppn} onChange={e => up('loloPort', 'ppn', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>FP</label><input type="text" value={costs.loloPort.fp} onChange={e => up('loloPort', 'fp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>GP No</label><input type="text" value={costs.loloPort.gpNo} onChange={e => up('loloPort', 'gpNo', e.target.value)} style={inputSt} /></div>
        </Grid6>
      </CostSection>

      <CostSection title="LOLO (Hico/Bahandel)">
        <Grid6>
          <div><label style={labelSt}>Vendor Name</label><input type="text" value={costs.loloHicoBahandel.vendorName} onChange={e => up('loloHicoBahandel', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Inv No <PaymentBadge shipmentId={shipmentId} categoryKey="loloHicoBahandel" /></label><input type="text" value={costs.loloHicoBahandel.invNo} onChange={e => up('loloHicoBahandel', 'invNo', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>DPP</label><input type="number" value={costs.loloHicoBahandel.dpp} onChange={e => up('loloHicoBahandel', 'dpp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPN</label><input type="number" value={costs.loloHicoBahandel.ppn} onChange={e => up('loloHicoBahandel', 'ppn', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>FP / GP No</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="FP" value={costs.loloHicoBahandel.fp} onChange={e => up('loloHicoBahandel', 'fp', e.target.value)} style={inputSt} />
              <input type="text" placeholder="GP" value={costs.loloHicoBahandel.gpNo} onChange={e => up('loloHicoBahandel', 'gpNo', e.target.value)} style={inputSt} />
            </div>
          </div>
          <div />
        </Grid6>
      </CostSection>

      <CostSection title="LOLO (Gudang Port)">
        <Grid6>
          <div><label style={labelSt}>Vendor Name</label><input type="text" value={costs.loloGudangPort.vendorName} onChange={e => up('loloGudangPort', 'vendorName', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Inv No <PaymentBadge shipmentId={shipmentId} categoryKey="loloGudangPort" /></label><input type="text" value={costs.loloGudangPort.invNo} onChange={e => up('loloGudangPort', 'invNo', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>DPP</label><input type="number" value={costs.loloGudangPort.dpp} onChange={e => up('loloGudangPort', 'dpp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>PPN</label><input type="number" value={costs.loloGudangPort.ppn} onChange={e => up('loloGudangPort', 'ppn', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>FP</label><input type="text" value={costs.loloGudangPort.fp} onChange={e => up('loloGudangPort', 'fp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>GP No</label><input type="text" value={costs.loloGudangPort.gpNo} onChange={e => up('loloGudangPort', 'gpNo', e.target.value)} style={inputSt} /></div>
        </Grid6>
      </CostSection>

      <CostRollup label="LANDED PORT & WAREHOUSE" value={totals.lolo.landed} hint="LOLO (Port + Hico + Gudang Port)" />
      <CostRollup label="TOTAL PORT & WAREHOUSE (+TAX)" value={totals.lolo.total} isGrand />
    </>
  );
};

export default TabLolo;
