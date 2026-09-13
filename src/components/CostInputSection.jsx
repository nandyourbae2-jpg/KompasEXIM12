import React, { useState, useEffect, useMemo, useRef } from 'react';
import VendorSelect from './VendorSelect';
import { computeDepoFull, validateManualInputs } from '../utils/depoCalcEngine';
import { OTHER_COST_CATEGORIES } from '../utils/constants';

const CostInputSection = ({
  title, containerId, shipmentId, category, existing, fields, onLiveUpdate,
  // Depo-specific props (only passed when category === 'DEPO')
  depoRoute, depoPrices, freeTime, depoArrival, depoDepart,
}) => {
  const [form, setForm] = useState(existing || {});

  useEffect(() => {
    if (existing && Object.keys(existing).length > 0) {
      setForm(prev => {
        if (prev.id !== existing.id || Object.keys(prev).length === 0) {
          return { ...existing };
        }
        return prev;
      });
    }
  }, [existing]);

  // ─── Depo Calculation Engine ────────────────────────────────────────
  const depoComputed = useMemo(() => {
    if (category !== 'DEPO') return null;
    return computeDepoFull({
      depoArrival: depoArrival,
      depoDepart: depoDepart,
      freeTime: freeTime,
      actDay: form.act_day,
      actShift: form.act_shift,
      depoPrices: depoPrices || [],
      depoRoute: depoRoute,
    });
  }, [
    category, depoArrival, depoDepart, freeTime,
    form.act_day, form.act_shift, depoPrices, depoRoute,
  ]);

  // ─── Computed DPP logic ─────────────────────────────────────────────
  const computedDpp = category === 'TRUC (Warehouse)'
    ? (parseFloat(form.biaya_dasar) || 0) + (parseFloat(form.inap_sasis) || 0) + (parseFloat(form.other_cost) || 0)
    : parseFloat(form.dpp) || 0;

  // For DEPO, use the form values since the user can override them
  const computedDppDepo = category === 'DEPO'
    ? (parseFloat(form.storage) || 0) + (parseFloat(form.monitoring) || 0) +
      (parseFloat(form.recooling) || 0) + (parseFloat(form.lolo_depo) || 0)
    : 0;

  const effectiveDpp = category === 'TRUC (Warehouse)' ? computedDpp
                     : category === 'DEPO' ? computedDppDepo
                     : computedDpp;

  const ppnRate = parseFloat(form.persen_ppn) || 0;
  const ppnAuto  = effectiveDpp * ppnRate / 100;
  const totalAuto = effectiveDpp + ppnAuto;

  const depoCalcDay = depoComputed?.calcDay;
  const depoCalcShift = depoComputed?.calcShift;

  // ─── Auto-sync Depo Computation to Form ─────────────────────────────
  // Track last computed values to only update form when the engine output changes.
  const lastComputedRef = useRef(null);
  useEffect(() => {
    if (category === 'DEPO' && depoComputed && !depoComputed.priceError && !depoComputed.validationErrors?.length) {
      const prev = lastComputedRef.current;
      const curr = {
        storage: depoComputed.storage,
        monitoring: depoComputed.monitoring,
        recooling: depoComputed.recooling,
        lolo: depoComputed.lolo,
      };

      if (!prev || prev.storage !== curr.storage || prev.monitoring !== curr.monitoring || prev.recooling !== curr.recooling || prev.lolo !== curr.lolo) {
        setForm(p => ({
          ...p,
          storage: curr.storage,
          monitoring: curr.monitoring,
          recooling: curr.recooling,
          lolo_depo: curr.lolo,
        }));
        lastComputedRef.current = curr;
      }
    }
  }, [category, depoComputed]);

  useEffect(() => {
    if (onLiveUpdate) {
      const liveData = {
        ...form,
        container_id: containerId,
        shipment_id: shipmentId,
        cost_category: category,
        dpp: effectiveDpp,
        ppn: ppnAuto,
        total: totalAuto,
      };

      // For DEPO, inject the engine-computed calc day/shift, but keep editable costs from form
      if (category === 'DEPO' && depoComputed) {
        liveData.calc_day = depoComputed.calcDay;
        liveData.calc_shift = depoComputed.calcShift;
        liveData.storage = parseFloat(form.storage) || 0;
        liveData.monitoring = parseFloat(form.monitoring) || 0;
        liveData.recooling = parseFloat(form.recooling) || 0;
        liveData.lolo_depo = parseFloat(form.lolo_depo) || 0;
      }

      onLiveUpdate(liveData);
    }
  }, [form, effectiveDpp, ppnAuto, totalAuto, depoComputed]);

  const inputSt = {
    width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none', transition: 'border 0.2s', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)'
  };
  const labelSt = { fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-muted-80)', display: 'block', marginBottom: '4px' };
  const readOnlySt = { ...inputSt, backgroundColor: 'var(--color-canvas-parchment)', color: 'var(--color-ink-muted-48)', borderColor: 'transparent', cursor: 'not-allowed' };
  const computedSt = { ...inputSt, backgroundColor: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd', cursor: 'not-allowed', fontWeight: '600' };
  const warningSt = {
    padding: '8px 12px', borderRadius: '6px', backgroundColor: '#fef3c7', border: '1px solid #fcd34d',
    color: '#92400e', fontSize: '12px', fontWeight: '500', marginBottom: '12px',
    display: 'flex', alignItems: 'center', gap: '6px'
  };

  return (
    <div style={{ marginBottom: '20px', background: 'var(--color-canvas)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-divider-soft)', position: 'relative' }}>
      <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>{title}</h4>

      {category === 'DEPO' && !depoRoute && (
        <div style={{ ...warningSt, backgroundColor: '#fee2e2', borderColor: '#f87171', color: '#991b1b' }}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          Mohon pilih Depo Route terlebih dahulu di tab Identitas & Tracking.
        </div>
      )}

      {/* Depo Price Warning */}
      {category === 'DEPO' && depoComputed?.priceError && (
        <div style={warningSt}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          {depoComputed.priceError}
        </div>
      )}

      {/* Jenis Cost / Keterangan Validation Errors */}
      {category === 'OTHE (Other Cost)' && (!form.jenis_cost || !form.ket_other) && (
        <div style={{ ...warningSt, backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
          <span style={{ fontSize: '16px' }}>❌</span>
          {(!form.jenis_cost && !form.ket_other) ? 'Jenis Cost dan Keterangan wajib diisi.' :
           !form.jenis_cost ? 'Jenis Cost wajib dipilih.' : 'Keterangan wajib diisi.'}
        </div>
      )}

      {/* Depo Validation Errors */}
      {category === 'DEPO' && depoComputed?.validationErrors?.length > 0 && (
        <div style={{ ...warningSt, backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
          <span style={{ fontSize: '16px' }}>❌</span>
          {depoComputed.validationErrors.join('. ')}
        </div>
      )}

      {/* Depo Calculation Summary */}
      {category === 'DEPO' && depoComputed?.audit && (
        <div style={{ marginBottom: '20px', border: '1px solid var(--color-hairline)', borderRadius: '6px', background: '#fafafa', overflow: 'hidden' }}>
          <div style={{ background: '#f0f0f0', padding: '8px 12px', fontWeight: '600', fontSize: '13px', borderBottom: '1px solid var(--color-hairline)' }}>Calculation Summary</div>
          <div style={{ padding: '0 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e5e7eb', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-ink-muted-80)' }}>Depo Route</span>
              <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{depoRoute || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e5e7eb', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-ink-muted-80)' }}>Duration</span>
              <span style={{ fontWeight: '500' }}>{depoComputed.audit.totalDuration || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e5e7eb', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-ink-muted-80)' }}>Total Days</span>
              <span style={{ fontWeight: '500' }}>{depoComputed.audit.totalDays ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e5e7eb', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-ink-muted-80)' }}>Calc Day</span>
              <span style={{ fontWeight: '500' }}>{depoComputed.audit.calcDay ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e5e7eb', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-ink-muted-80)' }}>Calc Shift</span>
              <span style={{ fontWeight: '500' }}>{depoComputed.audit.calcShift ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e5e7eb', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-ink-muted-80)' }}>Act Day</span>
              <span style={{ fontWeight: '500', color: '#0369a1' }}>{depoComputed.audit.actDay || '(User Input)'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e5e7eb', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-ink-muted-80)' }}>Act Shift</span>
              <span style={{ fontWeight: '500', color: '#0369a1' }}>{depoComputed.audit.actShift || '(User Input)'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-ink-muted-80)' }}>Price Version</span>
              <span style={{ fontWeight: '500' }}>{depoComputed.audit.effectiveDate ? `Effective Date ${new Date(depoComputed.audit.effectiveDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}` : '—'}</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {/* Vendor Name */}
        {fields.includes('vendor_name') && (
          <div>
            <label style={labelSt}>Vendor Name</label>
            {category === 'DEPO' ? (
              <input
                value={depoRoute ? `${depoRoute}` : '—'}
                readOnly
                style={computedSt}
              />
            ) : (
              <VendorSelect
                value={form.vendor_name || ''}
                onChange={val => setForm(p => ({ ...p, vendor_name: val }))}
                placeholder="Pilih / Ketik Vendor"
              />
            )}
          </div>
        )}

        {/* Jenis Cost */}
        {fields.includes('jenis_cost') && (
          <div>
            <label style={labelSt}>Jenis Cost <span style={{ color: '#dc2626' }}>*</span></label>
            <select
              value={form.jenis_cost || ''}
              onChange={e => setForm(p => ({ ...p, jenis_cost: e.target.value }))}
              style={inputSt}
            >
              <option value="" disabled>— Pilih Jenis Cost —</option>
              {OTHER_COST_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Inv No */}
        {fields.includes('inv_no') && (
          <div>
            <label style={labelSt}>No. Invoice</label>
            <input
              value={form.inv_no || ''}
              onChange={e => setForm(p => ({ ...p, inv_no: e.target.value }))}
              
              placeholder="Nomor invoice"
              style={inputSt}
            />
          </div>
        )}

        {/* TRUC Warehouse Fields */}
        {category === 'TRUC (Warehouse)' && (
          <>
            {[
              { key: 'biaya_dasar', label: 'Biaya Dasar' },
              { key: 'inap_sasis',  label: 'Inap Sasis' },
              { key: 'other_cost',  label: 'Other Cost' }
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={labelSt}>{label}</label>
                <input
                  type="number"
                  value={form[key] || ''}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  
                  style={inputSt}
                />
              </div>
            ))}
            <div>
              <label style={labelSt}>DPP (Auto)</label>
              <input value={effectiveDpp.toLocaleString('id-ID')} readOnly style={readOnlySt} />
            </div>
          </>
        )}

        {/* Keterangan Other / Remark */}
        {fields.includes('ket_other') && (
          <div>
            <label style={labelSt}>Keterangan {category === 'OTHE (Other Cost)' && <span style={{ color: '#dc2626' }}>*</span>}</label>
            <input
              value={form.ket_other || ''}
              onChange={e => setForm(p => ({ ...p, ket_other: e.target.value }))}
              
              placeholder="Remark"
              style={inputSt}
            />
          </div>
        )}

        {/* ─── DEPO Fields (Engine-Driven) ─────────────────────────────── */}
        {category === 'DEPO' && (
          <>
            {/* Calc Day — READ ONLY (auto-computed from stack/gateOut) */}
            <div>
              <label style={labelSt}>Calc Day <span style={{ fontSize: '10px', color: '#0369a1', fontWeight: '400' }}>(auto)</span></label>
              <input
                value={depoCalcDay != null ? depoCalcDay : '—'}
                readOnly
                style={computedSt}
                title={depoComputed?.audit?.calcDayFormula || ''}
              />
            </div>

            {/* Calc Shift — READ ONLY (auto-computed from stack/gateOut) */}
            <div>
              <label style={labelSt}>Calc Shift <span style={{ fontSize: '10px', color: '#0369a1', fontWeight: '400' }}>(auto)</span></label>
              <input
                value={depoCalcShift != null ? depoCalcShift : '—'}
                readOnly
                style={computedSt}
                title={depoComputed?.audit?.calcShiftFormula || ''}
              />
            </div>

            {/* Act Day — MANUAL INPUT */}
            <div>
              <label style={labelSt}>Act Day <span style={{ fontSize: '10px', color: '#059669', fontWeight: '400' }}>(manual)</span></label>
              <input
                type="number"
                min="0"
                value={form.act_day ?? ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val, 10) >= 0) {
                    setForm(p => ({ ...p, act_day: val }));
                  }
                }}
                style={inputSt}
                placeholder="Isi hari aktual"
              />
            </div>

            {/* Act Shift — MANUAL INPUT */}
            <div>
              <label style={labelSt}>Act Shift <span style={{ fontSize: '10px', color: '#059669', fontWeight: '400' }}>(manual)</span></label>
              <input
                type="number"
                min="0"
                value={form.act_shift ?? ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val, 10) >= 0) {
                    setForm(p => ({ ...p, act_shift: val }));
                  }
                }}
                style={inputSt}
                placeholder="Isi shift aktual"
              />
            </div>

            {/* Storage — Editable but defaults to auto */}
            <div>
              <label style={labelSt}>Storage (Rp) <span style={{ fontSize: '10px', color: '#059669', fontWeight: '400' }}>(manual)</span></label>
              <input
                type="number"
                min="0"
                value={form.storage ?? ''}
                onChange={e => setForm(p => ({ ...p, storage: e.target.value }))}
                style={inputSt}
              />
            </div>

            {/* Monitoring — Editable but defaults to auto */}
            <div>
              <label style={labelSt}>Monitoring (Rp) <span style={{ fontSize: '10px', color: '#059669', fontWeight: '400' }}>(manual)</span></label>
              <input
                type="number"
                min="0"
                value={form.monitoring ?? ''}
                onChange={e => setForm(p => ({ ...p, monitoring: e.target.value }))}
                style={inputSt}
              />
            </div>

            {/* Recooling — Editable but defaults to auto */}
            <div>
              <label style={labelSt}>Recooling (Rp) <span style={{ fontSize: '10px', color: '#059669', fontWeight: '400' }}>(manual)</span></label>
              <input
                type="number"
                min="0"
                value={form.recooling ?? ''}
                onChange={e => setForm(p => ({ ...p, recooling: e.target.value }))}
                style={inputSt}
              />
            </div>

            {/* LoLo — Editable but defaults to auto */}
            <div>
              <label style={labelSt}>LoLo (Rp) <span style={{ fontSize: '10px', color: '#059669', fontWeight: '400' }}>(manual)</span></label>
              <input
                type="number"
                min="0"
                value={form.lolo_depo ?? ''}
                onChange={e => setForm(p => ({ ...p, lolo_depo: e.target.value }))}
                style={inputSt}
              />
            </div>

            {/* DPP Auto */}
            <div>
              <label style={labelSt}>DPP (Auto)</label>
              <input value={effectiveDpp.toLocaleString('id-ID')} readOnly style={readOnlySt} />
            </div>

            {/* Price Info Badge */}
            {depoComputed && !depoComputed.priceError && depoComputed.audit?.effectiveDate && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '11px', color: '#166534' }}>
                <span>✓</span>
                <span>Harga Depo: <strong>{depoRoute}</strong> — Berlaku sejak {depoComputed.audit.effectiveDate}</span>
              </div>
            )}
          </>
        )}

        {/* LOLO Hico Category */}
        
        {/* Direct DPP input for others */}
        {category !== 'TRUC (Warehouse)' && category !== 'DEPO' && fields.includes('dpp') && (
          <div>
            <label style={labelSt}>DPP</label>
            <input
              type="number"
              value={form.dpp || ''}
              onChange={e => setForm(p => ({ ...p, dpp: parseFloat(e.target.value) || 0 }))}
              
              style={inputSt}
            />
          </div>
        )}

        {/* %PPN */}
        {fields.includes('persen_ppn') && (
          <div>
            <label style={labelSt}>%PPN</label>
            <input
              type="number"
              value={form.persen_ppn ?? ''}
              onChange={e => setForm(p => ({ ...p, persen_ppn: parseFloat(e.target.value) || 0 }))}
              
              style={inputSt}
            />
          </div>
        )}

        {/* PPN Auto */}
        {fields.includes('ppn_auto') && (
          <div>
            <label style={labelSt}>PPN (Auto)</label>
            <input value={ppnAuto.toLocaleString('id-ID')} readOnly style={readOnlySt} />
          </div>
        )}

        {/* No. FP */}
        {fields.includes('no_fp') && (
          <div>
            <label style={labelSt}>No. FP</label>
            <input
              value={form.no_fp || ''}
              onChange={e => setForm(p => ({ ...p, no_fp: e.target.value }))}
              
              style={inputSt}
            />
          </div>
        )}
        
        {/* GP No */}
        {fields.includes('gp_no') && (
          <div>
            <label style={labelSt}>GP No.</label>
            <input
              value={form.gp_no || ''}
              onChange={e => setForm(p => ({ ...p, gp_no: e.target.value }))}
              
              style={inputSt}
            />
          </div>
        )}
      </div>

      <div style={{
        marginTop: '12px', padding: '10px 14px',
        background: 'var(--color-canvas-parchment)',
        borderRadius: '6px', display: 'flex', justifyContent: 'flex-end',
        border: '1px solid var(--color-hairline)'
      }}>
        <span style={{ fontSize: '13px', color: 'var(--color-ink)' }}>
          Total {title} [+PPN]:{' '}
          <strong style={{ fontSize: '15px' }}>Rp {totalAuto.toLocaleString('id-ID')}</strong>
        </span>
      </div>
    </div>
  );
};

export default CostInputSection;
