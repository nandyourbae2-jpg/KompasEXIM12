import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import CostSection from '../../../../components/CostSection';
import useImportOperationalStore from '../../../../store/useImportOperationalStore';
import useImportProjectStore from '../../../../store/useImportProjectStore';
import useVendorStore from '../../../../store/useVendorStore';
import { emptyContainer } from '../../../../utils/importCalc';

const KAT_OPTIONS = ['RM', 'Ind. Food', 'Ind. Pckg', 'Aset', 'Misc', 'Reim', 'Reex'];
const MODE_OPTIONS = ['FCL', 'LCL Sea', 'LCL Air', 'Courier', 'MV'];
const UOM_OPTIONS = ['MT', 'KG', 'PCS', 'CBM', 'CARTON', 'PALLET'];

const calcHours = (endIso, startIso) => {
  if (!endIso || !startIso) return null;
  const end = new Date(endIso).getTime();
  const start = new Date(startIso).getTime();
  if (isNaN(end) || isNaN(start)) return null;
  const diffHours = (end - start) / (1000 * 60 * 60);
  return Math.round(diffHours * 10) / 10;
};

const TabIdentitas = ({ identity, setIdentity, containers, setContainers }) => {
  const { masterData } = useImportOperationalStore();
  const { importProjects } = useImportProjectStore();
  const { vendors } = useVendorStore();

  const activeTruckingVendors = vendors.filter(v => v.service_type === 'Trucking' && v.status === 'Aktif');

  const linkedProject = identity.importProjectId
    ? importProjects.find(p => p.id === identity.importProjectId)
    : null;

  const iden = (field, val) => setIdentity(prev => ({ ...prev, [field]: val }));

  const updateContainer = (index, field, val) => {
    setContainers(prev => {
      const newConts = [...prev];
      const updated = { ...newConts[index], [field]: val };
      
      // Auto calc
      updated.lamaInapSasis = calcHours(updated.gateOutWh, updated.truWhGateInWh);
      updated.waktuAntri = calcHours(updated.offlStart, updated.truWhGateInWh);
      updated.durasioBongkar = calcHours(updated.offlEnd, updated.offlStart);
      
      newConts[index] = updated;
      return newConts;
    });
  };

  const addContainer = () => setContainers(prev => [...prev, emptyContainer()]);
  
  const removeContainer = (index) => {
    if (containers.length <= 1) {
      alert("Minimal 1 kontainer harus ada.");
      return;
    }
    if (confirm("Yakin ingin menghapus kontainer ini?")) {
      setContainers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const inputSt = {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-sm)',
    fontSize: '13px', fontFamily: 'var(--font-family-body)',
    outline: 'none', backgroundColor: 'var(--color-canvas)',
    color: 'var(--color-ink)', boxSizing: 'border-box',
  };

  const readOnlySt = { ...inputSt, backgroundColor: 'var(--color-canvas-parchment)', cursor: 'not-allowed' };

  const labelSt = {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: '600',
    color: 'var(--color-ink)', marginBottom: '5px',
  };

  const sourceBadge = linkedProject ? (
    <span style={{
      fontSize: '10px', fontWeight: '600', padding: '1px 6px',
      borderRadius: 'var(--rounded-xs)',
      backgroundColor: 'var(--color-status-info-bg)',
      color: 'var(--color-primary)',
      whiteSpace: 'nowrap',
    }}>
      dari {identity.importProjectId}
    </span>
  ) : null;

  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' };

  return (
    <>
      {linkedProject && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          backgroundColor: 'var(--color-status-info-bg)',
          border: '1px solid var(--color-status-info)',
          borderRadius: 'var(--rounded-md)',
          padding: '12px 16px',
          marginBottom: '24px',
          fontSize: '13px', color: 'var(--color-primary)',
        }}>
          <span style={{ fontWeight: '700' }}>🔗 Terhubung ke Import Project</span>
          <span style={{ color: 'var(--color-ink-muted-80)' }}>
            {identity.importProjectId} — {linkedProject.supplier} ({linkedProject.importType})
          </span>
        </div>
      )}

      <CostSection title="Identitas Umum">
        <div style={gridStyle}>
          <div>
            <label style={labelSt}>
              Kode UN
              {sourceBadge}
            </label>
            <input type="text" value={identity.un || ''} onChange={e => iden('un', e.target.value)} style={inputSt} />
          </div>

          <div>
            <label style={labelSt}>
              Kategori (Kat)
              {sourceBadge}
            </label>
            <select value={identity.kat} onChange={e => iden('kat', e.target.value)} style={inputSt}>
              {KAT_OPTIONS.map(k => <option key={k}>{k}</option>)}
            </select>
          </div>

          <div>
            <label style={labelSt}>
              Supplier
              {sourceBadge}
            </label>
            <select value={identity.supplier} onChange={e => iden('supplier', e.target.value)} style={inputSt}>
              <option value="">— Pilih Supplier —</option>
              {masterData.suppliers.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={labelSt}>
              Trade (Asal Negara)
              {sourceBadge}
            </label>
            <input type="text" value={identity.trade || ''} onChange={e => iden('trade', e.target.value)} style={inputSt} placeholder="mis. Korea Selatan" />
          </div>

          <div>
            <label style={labelSt}>
              Shipment Term
              {sourceBadge}
            </label>
            <input type="text" value={identity.shipmentTerm || ''} onChange={e => iden('shipmentTerm', e.target.value)} style={inputSt} placeholder="mis. CIF, FOB, CFR" />
          </div>

          <div>
            <label style={labelSt}>
              Invoice No.
              {sourceBadge}
            </label>
            <input type="text" value={identity.inv || ''} onChange={e => iden('inv', e.target.value)} style={inputSt} />
          </div>

          <div>
            <label style={labelSt}>
              BL / SWB / AWB
              {sourceBadge}
            </label>
            <input type="text" value={identity.blSwbAwb || ''} onChange={e => iden('blSwbAwb', e.target.value)} style={inputSt} />
          </div>

          <div>
            <label style={labelSt}>
              ETD (Est. Keberangkatan)
              {sourceBadge}
            </label>
            <input type="date" value={identity.etd || ''} onChange={e => iden('etd', e.target.value)} style={inputSt} />
          </div>

          <div>
            <label style={labelSt}>
              ETA (Est. Kedatangan)
              {sourceBadge}
            </label>
            <input type="date" value={identity.eta || ''} onChange={e => iden('eta', e.target.value)} style={inputSt} />
          </div>

          <div>
            <label style={labelSt}>
              ATA (Actual Kedatangan)
            </label>
            <input type="date" value={identity.ata || ''} onChange={e => iden('ata', e.target.value)} style={inputSt} />
          </div>

          <div>
            <label style={labelSt}>
              HS Code
              {sourceBadge}
            </label>
            <input type="text" value={identity.hsCode || ''} onChange={e => iden('hsCode', e.target.value)} style={inputSt} placeholder="mis. 7209.17.00" />
          </div>

          <div>
            <label style={labelSt}>
              Free Time Destination
              {sourceBadge}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="number" min="0" value={identity.freeTimeDest || ''} onChange={e => iden('freeTimeDest', e.target.value)} style={{ ...inputSt, flex: 1 }} placeholder="0" />
              <span style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)', whiteSpace: 'nowrap' }}>Hari</span>
            </div>
          </div>

          <div>
            <label style={labelSt}>Mode Transport</label>
            <select value={identity.modeTransport} onChange={e => iden('modeTransport', e.target.value)} style={inputSt}>
              {MODE_OPTIONS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 2 }}>
              <label style={labelSt}>Qtty</label>
              <input type="number" value={identity.qtty || ''} onChange={e => iden('qtty', e.target.value)} style={inputSt} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelSt}>UoM</label>
              <select value={identity.qttyUom} onChange={e => iden('qttyUom', e.target.value)} style={inputSt}>
                {UOM_OPTIONS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelSt}>Depo Route</label>
            <select value={identity.depo} onChange={e => iden('depo', e.target.value)} style={inputSt}>
              <option value="">— Pilih Depo —</option>
              {masterData.depoRoutes.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label style={labelSt}>Gudang</label>
            <select value={identity.gudang} onChange={e => iden('gudang', e.target.value)} style={inputSt}>
              <option value="">— Pilih Gudang —</option>
              {masterData.whRoutes.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>

          <div>
            <label style={labelSt}>Import Project</label>
            {linkedProject ? (
              <div style={{
                padding: '9px 12px',
                border: '1px solid var(--color-status-info)',
                borderRadius: 'var(--rounded-sm)',
                backgroundColor: 'var(--color-status-info-bg)',
                fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600',
              }}>
                {identity.importProjectId}
              </div>
            ) : (
              <select value={identity.importProjectId || ''} onChange={e => iden('importProjectId', e.target.value)} style={inputSt}>
                <option value="">— Tidak terhubung —</option>
                {importProjects.map(p => <option key={p.id} value={p.id}>{p.id} — {p.supplier}</option>)}
              </select>
            )}
          </div>
        </div>
      </CostSection>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', marginTop: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)' }}>Tracking Waktu Operasional</h2>
        <button onClick={addContainer} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: 'var(--rounded-pill)',
          border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff',
          fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        }}>
          <Plus size={14} /> Tambah Kontainer
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {containers.map((contData, idx) => (
          <CostSection key={idx} title={`Kontainer ${idx + 1} — ${contData.cont || 'Belum ada nomor'}`}>
            <div style={gridStyle}>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '16px', marginBottom: '8px' }}>
                <div style={{ width: '300px' }}>
                  <label style={labelSt}>No. Kontainer</label>
                  <input type="text" value={contData.cont || ''} onChange={e => updateContainer(idx, 'cont', e.target.value)} style={inputSt} placeholder="mis. TCKU1234567" />
                </div>
                <button onClick={() => removeContainer(idx)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 12px', borderRadius: 'var(--rounded-md)',
                  border: '1px solid var(--color-status-danger)', backgroundColor: '#fff',
                  color: 'var(--color-status-danger)', fontSize: '12px', cursor: 'pointer',
                  fontWeight: '600'
                }}>
                  <Trash2 size={14} /> Hapus Kontainer
                </button>
              </div>

              <div>
                <label style={labelSt}>Port Stacking</label>
                <input type="datetime-local" value={(contData.stack || '').slice(0, 16)} onChange={e => updateContainer(idx, 'stack', e.target.value ? e.target.value + ':00.000Z' : null)} style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Gate Out Port</label>
                <input type="datetime-local" value={(contData.gateOut || '').slice(0, 16)} onChange={e => updateContainer(idx, 'gateOut', e.target.value ? e.target.value + ':00.000Z' : null)} style={inputSt} />
              </div>
              <div /> {/* Spacer */}
              
              <div style={{ gridColumn: '1 / -1', borderBottom: '1px dashed var(--color-hairline)', margin: '4px 0' }} />
              
              <div>
                <label style={labelSt}>Trucking Repo Vendor</label>
                <select value={contData.truRepoVendor} onChange={e => updateContainer(idx, 'truRepoVendor', e.target.value)} style={inputSt}>
                  <option value="">— Pilih —</option>
                  {activeTruckingVendors.map(v => <option key={v.id} value={v.nama}>{v.nama}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Depo Arrival</label>
                <input type="datetime-local" value={(contData.truRepoArrival || '').slice(0, 16)} onChange={e => updateContainer(idx, 'truRepoArrival', e.target.value ? e.target.value + ':00.000Z' : null)} style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Depo Depart</label>
                <input type="datetime-local" value={(contData.truRepoDepart || '').slice(0, 16)} onChange={e => updateContainer(idx, 'truRepoDepart', e.target.value ? e.target.value + ':00.000Z' : null)} style={inputSt} />
              </div>

              <div style={{ gridColumn: '1 / -1', borderBottom: '1px dashed var(--color-hairline)', margin: '4px 0' }} />
              
              <div>
                <label style={labelSt}>Trucking WH Vendor</label>
                <select value={contData.truWhVendor} onChange={e => updateContainer(idx, 'truWhVendor', e.target.value)} style={inputSt}>
                  <option value="">— Pilih —</option>
                  {activeTruckingVendors.map(v => <option key={v.id} value={v.nama}>{v.nama}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Tru WH Gate In</label>
                <input type="datetime-local" value={(contData.truWhGateInWh || '').slice(0, 16)} onChange={e => updateContainer(idx, 'truWhGateInWh', e.target.value ? e.target.value + ':00.000Z' : null)} style={inputSt} />
              </div>
              <div />

              <div style={{ gridColumn: '1 / -1', borderBottom: '1px dashed var(--color-hairline)', margin: '4px 0' }} />
              
              <div>
                <label style={labelSt}>Offloading Start</label>
                <input type="datetime-local" value={(contData.offlStart || '').slice(0, 16)} onChange={e => updateContainer(idx, 'offlStart', e.target.value ? e.target.value + ':00.000Z' : null)} style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Offloading End</label>
                <input type="datetime-local" value={(contData.offlEnd || '').slice(0, 16)} onChange={e => updateContainer(idx, 'offlEnd', e.target.value ? e.target.value + ':00.000Z' : null)} style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Gate Out WH</label>
                <input type="datetime-local" value={(contData.gateOutWh || '').slice(0, 16)} onChange={e => updateContainer(idx, 'gateOutWh', e.target.value ? e.target.value + ':00.000Z' : null)} style={inputSt} />
              </div>

              <div style={{ gridColumn: '1 / -1', borderBottom: '1px dashed var(--color-hairline)', margin: '4px 0' }} />
              
              <div>
                <label style={labelSt}>Lama Inap Sasis (Jam)</label>
                <input type="text" value={contData.lamaInapSasis !== null ? `${contData.lamaInapSasis} Jam` : '—'} readOnly style={readOnlySt} />
              </div>
              <div>
                <label style={labelSt}>Waktu Antri (Jam)</label>
                <input type="text" value={contData.waktuAntri !== null ? `${contData.waktuAntri} Jam` : '—'} readOnly style={readOnlySt} />
              </div>
              <div>
                <label style={labelSt}>Durasi Bongkar (Jam)</label>
                <input type="text" value={contData.durasioBongkar !== null ? `${contData.durasioBongkar} Jam` : '—'} readOnly style={readOnlySt} />
              </div>

              <div style={{ gridColumn: '1 / -1', borderBottom: '1px dashed var(--color-hairline)', margin: '4px 0' }} />
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '24px' }}>
                {['fishIssue', 'queueIssue', 'spaceIssue', 'otherIssue'].map(k => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={contData[k] || false} onChange={e => updateContainer(idx, k, e.target.checked)} />
                    {k === 'fishIssue' ? 'Fish Issue' :
                     k === 'queueIssue' ? 'Queue Issue' :
                     k === 'spaceIssue' ? 'Space Issue' : 'Other Issue'}
                  </label>
                ))}
              </div>
            </div>
          </CostSection>
        ))}
      </div>
    </>
  );
};

export default TabIdentitas;
