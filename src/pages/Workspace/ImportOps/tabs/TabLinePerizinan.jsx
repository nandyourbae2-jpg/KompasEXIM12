import React, { useState, useEffect } from 'react';
import VendorSelect from '../../../../components/VendorSelect';
import CostSection from '../../../../components/CostSection';
import CostRollup from '../../../../components/CostRollup';
import PaymentBadge from '../../../../components/PaymentBadge';
import FlexibleCostSection from '../../../../components/FlexibleCostSection';
import api from '../../../../lib/api';
import { useAppleModal } from '../../../../contexts/AppleModalContext';

const FormRow = ({ children, columns = '1fr', style }) => (
  <div style={{ display: 'grid', gridTemplateColumns: columns, gap: '20px', marginBottom: '16px', ...style }}>
    {children}
  </div>
);

const TabLinePerizinan = ({ shipmentId, costs, updateCost, totals, updateContainerCost }) => {
  const up = (cat, field, val) => updateCost(cat, field, val);
  const { confirm, alert } = useAppleModal();

  const [isRealisasiLoading, setIsRealisasiLoading] = useState(false);
  const [aktualBm, setAktualBm] = useState(costs.othePib?._aktual_bm ?? '');
  const [aktualPpn, setAktualPpn] = useState(costs.othePib?._aktual_ppn ?? '');
  const [aktualPph, setAktualPph] = useState(costs.othePib?._aktual_pph ?? '');
  
  const [generalCosts, setGeneralCosts] = useState({
    'Line Freight': [],
    'Line Local': [],
    'Line Extend': []
  });

  useEffect(() => {
    const load = async () => {
      const token = JSON.parse(sessionStorage.getItem('kompas_exim_session') || '{}').token;
      const costRes = await fetch(`/api/import-shipments/${shipmentId}/container-costs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allCosts = await costRes.json();
      
      const genCosts = {
        'Line Freight': [],
        'Line Local': [],
        'Line Extend': []
      };
      
      allCosts.forEach(c => {
        if (!c.container_id && genCosts[c.cost_category]) {
          genCosts[c.cost_category].push(c);
        }
      });
      setGeneralCosts(genCosts);
    };
    if (shipmentId) load();
  }, [shipmentId]);

  const inputSt = {
    width: '100%', padding: '10px 12px',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-md)',
    fontSize: '13px', fontFamily: 'var(--font-family-body)',
    outline: 'none', backgroundColor: 'var(--color-canvas)',
    color: 'var(--color-ink)', boxSizing: 'border-box',
    transition: 'all 0.2s',
  };
  
  const autoSt = {
    ...inputSt,
    backgroundColor: 'var(--color-canvas-parchment)',
    color: 'var(--color-ink-muted-80)',
    cursor: 'not-allowed',
    borderColor: 'transparent'
  };

  const labelSt = {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: '600',
    color: 'var(--color-ink-muted-80)', marginBottom: '8px',
  };

  const reqSt = (val, conditionAmount) => {
    const isRequiredAndEmpty = (Number(conditionAmount) > 0) && !val;
    return {
      ...inputSt,
      border: isRequiredAndEmpty ? '1px solid var(--color-status-danger)' : inputSt.border,
      backgroundColor: isRequiredAndEmpty ? '#fef2f2' : inputSt.backgroundColor,
      boxShadow: isRequiredAndEmpty ? '0 0 0 1px rgba(239, 68, 68, 0.2)' : 'none'
    };
  };

  const isPibLinked = !!costs.othePib?._dari_pib_request;
  const pibRequestId = costs.othePib?._dari_pib_request;
  
  // Estimasi from PIB Request (read-only reference)
  const estBm = costs.othePib?._estimasi_bm || costs.othePib?.beaMasuk || 0;
  const estPpn = costs.othePib?._estimasi_ppn || costs.othePib?.ppn || 0;
  const estPph = costs.othePib?._estimasi_pph || costs.othePib?.pph || 0;
  const kasbon = costs.othePib?._kasbon || 0;

  // Parse aktual values
  const parsedBm = aktualBm !== '' ? parseFloat(aktualBm) : null;
  const parsedPpn = aktualPpn !== '' ? parseFloat(aktualPpn) : null;
  const parsedPph = aktualPph !== '' ? parseFloat(aktualPph) : null;
  const allAktualFilled = parsedBm !== null && parsedPpn !== null && parsedPph !== null;
  const aktualTotal = allAktualFilled ? parsedBm + parsedPpn + parsedPph : null;
  const lebihKurang = aktualTotal !== null ? kasbon - aktualTotal : null;
  
  const alreadyRealized = costs.othePib?._aktual_bm !== null && costs.othePib?._aktual_bm !== undefined;
  const fmtRp = (v) => v != null ? `Rp ${Math.abs(v).toLocaleString('id-ID')}` : '—';

  const handleCopyEstimasi = () => {
    setAktualBm(estBm);
    setAktualPpn(estPpn);
    setAktualPph(estPph);
  };

  const handleRealisasikanPIB = async () => {
    if (!allAktualFilled) return;
    if (!(await confirm('Simpan realisasi PIB? Status PIB Request akan berubah ke "Realized".'))) return;
    
    setIsRealisasiLoading(true);
    try {
      await api(`/pib-requests/${pibRequestId}/realize`, {
        method: 'PATCH',
        body: JSON.stringify({
          aktual_bm: parsedBm,
          aktual_ppn: parsedPpn,
          aktual_pph: parsedPph,
        })
      });
      await alert('✅ Realisasi PIB berhasil! Status PIB Request → Realized.');
      window.location.reload();
    } catch (err) {
      await alert('❌ Gagal menyimpan realisasi: ' + err.message);
    } finally {
      setIsRealisasiLoading(false);
    }
  };

  const GroupHeader = ({ title }) => (
    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)', borderBottom: '2px solid var(--color-divider-soft)', paddingBottom: '8px', marginBottom: '20px', marginTop: '32px' }}>
      {title}
    </div>
  );

  let totalLineLanded = 0;
  let totalLinePlusTax = 0;
  Object.values(generalCosts).forEach(arr => {
    arr.forEach(c => {
      totalLineLanded += (Number(c.dpp) || 0);
      totalLinePlusTax += (Number(c.total) || 0);
    });
  });

  return (
    <div style={{ padding: '0 8px' }}>
      <GroupHeader title="Line Charges" />
      
      <FlexibleCostSection
        title="Freight & Local Charges Origin" category="Line Freight" shipmentId={shipmentId}
        costs={generalCosts['Line Freight']}
        fields={['vendor_name', 'inv_no', 'gp_no', 'dpp', 'persen_ppn', 'no_fp', 'ppn_auto']}
        onUpdateLocal={(newArr) => setGeneralCosts(p => ({ ...p, 'Line Freight': newArr }))}
        updateContainerCost={updateContainerCost}
      />
      
      <FlexibleCostSection
        title="Local Charges Indonesia" category="Line Local" shipmentId={shipmentId}
        costs={generalCosts['Line Local']}
        fields={['vendor_name', 'inv_no', 'gp_no', 'dpp', 'persen_ppn', 'no_fp', 'ppn_auto']}
        onUpdateLocal={(newArr) => setGeneralCosts(p => ({ ...p, 'Line Local': newArr }))}
        updateContainerCost={updateContainerCost}
      />
      
      <FlexibleCostSection
        title="Extend DO / Demdet" category="Line Extend" shipmentId={shipmentId}
        costs={generalCosts['Line Extend']}
        fields={['vendor_name', 'inv_no', 'gp_no', 'dpp', 'persen_ppn', 'no_fp', 'ppn_auto']}
        onUpdateLocal={(newArr) => setGeneralCosts(p => ({ ...p, 'Line Extend': newArr }))}
        updateContainerCost={updateContainerCost}
      />

      <CostRollup label="TOTAL LINE LANDED" value={totalLineLanded} hint="DPP Freight + Local IDN + Extend DO" />
      <CostRollup label="TOTAL LINE (+TAX)" value={totalLinePlusTax} isGrand />

      <GroupHeader title="Perizinan & Bea Cukai" />
      
      {/* PIB Section is unchanged because it's specific */}
      <CostSection title="PIB & Pajak" total={totals.othePib.total} totalLabel="Total Estimasi (+Tax+PPh)">
        {!isPibLinked && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--rounded-md)', color: '#c2410c', fontSize: '13px' }}>
            ⚠️ <strong>Manual Entry.</strong> Biaya ini tidak terhubung dengan PIB Request System. Sinkronisasi dengan Finance tidak akan berjalan otomatis. (Direkomendasikan membuat via menu PIB Request)
          </div>
        )}
        
        {isPibLinked && (
          <div style={{
            marginBottom: '20px', padding: '16px',
            backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--rounded-lg)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Terkoneksi dengan Sistem Finance</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Request #{pibRequestId}</div>
                <div style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: '600' }}>Approved</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Dana Tersedia (Kasbon)</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{fmtRp(kasbon)}</div>
            </div>
          </div>
        )}

        <FormRow columns="1fr 1fr 1fr">
          <div><label style={labelSt}>No. Aju / Billing</label><input type="text" value={costs.othePib.noAjuPib} onChange={e => up('othePib', 'noAjuPib', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Vendor Name</label><VendorSelect value={costs.othePib.vendorName} onChange={val => up('othePib', 'vendorName', val)} style={inputSt} /></div>
          <div><label style={labelSt}>GP No</label><input type="text" value={costs.othePib.gpNo} onChange={e => up('othePib', 'gpNo', e.target.value)} style={inputSt} /></div>
        </FormRow>

        {!isPibLinked && (
           <FormRow columns="1fr 1fr 1fr" style={{ marginBottom: 0 }}>
             <div><label style={labelSt}>Bea Masuk</label><input type="number" value={costs.othePib.beaMasuk} onChange={e => up('othePib', 'beaMasuk', e.target.value)} style={inputSt} /></div>
             <div><label style={labelSt}>PPN Import</label><input type="number" value={costs.othePib.ppn} onChange={e => up('othePib', 'ppn', e.target.value)} style={inputSt} /></div>
             <div><label style={labelSt}>PPh Import</label><input type="number" value={costs.othePib.pph} onChange={e => up('othePib', 'pph', e.target.value)} style={inputSt} /></div>
           </FormRow>
        )}

        {isPibLinked && (
          <div style={{ marginTop: '8px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-canvas-parchment)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--color-ink-muted-80)', borderBottom: '1px solid var(--color-hairline)' }}>Komponen</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: 'var(--color-ink-muted-80)', borderBottom: '1px solid var(--color-hairline)' }}>Estimasi (Approval)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: 'var(--color-ink-muted-80)', borderBottom: '1px solid var(--color-hairline)' }}>Aktual (Biling)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: 'var(--color-ink-muted-80)', borderBottom: '1px solid var(--color-hairline)' }}>Selisih</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Bea Masuk', est: estBm, state: aktualBm, set: setAktualBm, id: 'bm' },
                  { label: 'PPN Import', est: estPpn, state: aktualPpn, set: setAktualPpn, id: 'ppn' },
                  { label: 'PPh Import', est: estPph, state: aktualPph, set: setAktualPph, id: 'pph' }
                ].map((row, i) => {
                  const valNum = row.state !== '' ? parseFloat(row.state) : null;
                  const selisih = valNum !== null ? valNum - row.est : null;
                  return (
                    <tr key={row.id} style={{ borderBottom: i < 2 ? '1px solid var(--color-hairline)' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink)' }}>{row.label}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-ink-muted-80)' }}>{fmtRp(row.est)}</td>
                      <td style={{ padding: '8px 16px' }}>
                        {!alreadyRealized ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <div style={{ position: 'relative', width: '140px' }}>
                              <span style={{ position: 'absolute', left: '10px', top: '9px', fontSize: '13px', color: '#94a3b8' }}>Rp</span>
                              <input 
                                type="number" 
                                value={row.state} 
                                onChange={e => {
                                  row.set(e.target.value);
                                  if (!isPibLinked) {
                                    if(row.id === 'bm') up('othePib', 'beaMasuk', e.target.value);
                                    if(row.id === 'ppn') up('othePib', 'ppn', e.target.value);
                                    if(row.id === 'pph') up('othePib', 'pph', e.target.value);
                                  }
                                }}
                                style={{ ...inputSt, paddingLeft: '32px', textAlign: 'right', backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }} 
                                placeholder="0" 
                              />
                            </div>
                            {row.state === '' && (
                              <button 
                                onClick={() => row.set(row.est)} 
                                title="Gunakan nilai estimasi"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '12px', fontWeight: '600', padding: '4px' }}
                              >
                                = Estimasi
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                            {fmtRp(row.state)}
                          </div>
                        )}
                      </td>
                      <td style={{
                        padding: '12px 16px', textAlign: 'right',
                        color: selisih === null ? 'var(--color-ink-muted-48)'
                          : selisih > 0 ? 'var(--color-status-danger)'
                          : selisih < 0 ? 'var(--color-status-success)'
                          : 'var(--color-ink-muted-80)',
                        fontWeight: selisih !== null ? '600' : '500'
                      }}>
                        {selisih === null ? '—'
                          : `${selisih > 0 ? '+' : selisih < 0 ? '-' : ''}${fmtRp(selisih)}`}
                      </td>
                    </tr>
                  );
                })}

                <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--color-ink)' }}>TOTAL KESELURUHAN</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--color-ink)' }}>
                    {fmtRp(
                      (isPibLinked ? estBm : (Number(costs.othePib.estimasi_bm)||0)) + 
                      (isPibLinked ? estPpn : (Number(costs.othePib.estimasi_ppn)||0)) + 
                      (isPibLinked ? estPph : (Number(costs.othePib.estimasi_pph)||0))
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--color-ink)' }}>
                    {(() => {
                      const totalA = isPibLinked 
                        ? aktualTotal 
                        : ( (costs.othePib.beaMasuk !== '' && costs.othePib.beaMasuk !== undefined) || (costs.othePib.ppn !== '' && costs.othePib.ppn !== undefined) || (costs.othePib.pph !== '' && costs.othePib.pph !== undefined) 
                            ? (Number(costs.othePib.beaMasuk)||0) + (Number(costs.othePib.ppn)||0) + (Number(costs.othePib.pph)||0) 
                            : null );
                      return totalA !== null ? fmtRp(totalA) : '—';
                    })()}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700',
                    color: !isPibLinked || lebihKurang === null ? 'var(--color-ink-muted-48)' : lebihKurang >= 0 ? '#16a34a' : '#dc2626'
                  }}>
                    {!isPibLinked || lebihKurang === null ? '—'
                      : `${lebihKurang >= 0 ? 'Sisa Kasbon' : 'Kurang Dana'} ${fmtRp(lebihKurang)}`}
                  </td>
                </tr>
              </tbody>
            </table>

            {isPibLinked && allAktualFilled && (
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                  Semua nilai aktual telah diisi. Siap untuk direalisasi.
                </span>
                <button
                  onClick={handleRealisasikanPIB}
                  disabled={isRealisasiLoading}
                  style={{
                    background: '#2563eb',
                    color: 'white', border: 'none',
                    borderRadius: 'var(--rounded-md)',
                    padding: '10px 24px',
                    fontSize: '14px', fontWeight: '600',
                    cursor: isRealisasiLoading ? 'not-allowed' : 'pointer',
                    opacity: isRealisasiLoading ? 0.7 : 1,
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)',
                    transition: 'all 0.2s'
                  }}
                >
                  {isRealisasiLoading ? 'Menyimpan...' : '✓ Tandai Realisasi PIB'}
                </button>
              </div>
            )}
            {!isPibLinked && (
               <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--color-ink-muted-80)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <span style={{ fontSize: '16px' }}>💡</span> 
                 <span>Nilai aktual akan tersimpan saat Anda menekan tombol <strong>Simpan Semua</strong> di pojok kanan atas.</span>
               </div>
            )}
          </div>
        )}

        {isPibLinked && alreadyRealized && (
          <div style={{
            marginTop: '20px', padding: '16px 20px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--rounded-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(22, 163, 74, 0.05)'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>Realisasi PIB Telah Dilaporkan</div>
              <div style={{ fontSize: '13px', color: '#15803d' }}>
                Nilai akhir telah disinkronisasi dengan sistem Finance.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase' }}>BM Aktual</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#15803d' }}>{fmtRp(costs.othePib._aktual_bm)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase' }}>PPN Aktual</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#15803d' }}>{fmtRp(costs.othePib._aktual_ppn)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase' }}>PPh Aktual</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#15803d' }}>{fmtRp(costs.othePib._aktual_pph)}</div>
              </div>
            </div>
          </div>
        )}
      </CostSection>

      <CostSection title="Customs Bond">
        <FormRow columns="2fr 1fr 1fr">
          <div><label style={labelSt}>Vendor Name</label><VendorSelect value={costs.otheCustomsBond.vendorName} onChange={val => up('otheCustomsBond', 'vendorName', val)} style={reqSt(costs.otheCustomsBond.vendorName, costs.otheCustomsBond.dpp)} /></div>
          <div><label style={labelSt}>No. Inv CB <PaymentBadge shipmentId={shipmentId} categoryKey="otheCustomsBond" /></label><input type="text" value={costs.otheCustomsBond.noInvCb} onChange={e => up('otheCustomsBond', 'noInvCb', e.target.value)} style={reqSt(costs.otheCustomsBond.noInvCb, costs.otheCustomsBond.dpp)} /></div>
          <div><label style={labelSt}>GP No.</label><input type="text" value={costs.otheCustomsBond.gpNo} onChange={e => up('otheCustomsBond', 'gpNo', e.target.value)} style={inputSt} placeholder="Input GP No" /></div>
        </FormRow>
        <FormRow columns="1fr 1fr 2fr" style={{ marginBottom: 0 }}>
          <div><label style={labelSt}>DPP (Rp)</label><input type="number" value={costs.otheCustomsBond.dpp} onChange={e => up('otheCustomsBond', 'dpp', e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Diskon (Rp)</label><input type="number" value={costs.otheCustomsBond.diskon} onChange={e => up('otheCustomsBond', 'diskon', e.target.value)} style={inputSt} /></div>
          <div>{/* Empty space filler */}</div>
        </FormRow>
      </CostSection>

      <CostRollup label="TOTAL OTHE PIB LANDED" value={totals.othePib.landed} hint="Bea Masuk + (DPP CB - Diskon)" />
      <CostRollup label="TOTAL OTHE PIB (+TAX+PPH)" value={totals.othePib.total} isGrand />

    </div>
  );
};

export default TabLinePerizinan;
