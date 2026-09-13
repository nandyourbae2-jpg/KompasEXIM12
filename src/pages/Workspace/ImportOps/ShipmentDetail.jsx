import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import useImportOperationalStore from '../../../store/useImportOperationalStore';
import usePaymentStore from '../../../store/usePaymentStore';
import { calcTotals, fmtRupiah, mergeShipmentCosts } from '../../../utils/importCalc';
import api from '../../../lib/api';

import TabIdentitas from './tabs/TabIdentitas';
import TabTrucking from './tabs/TabTrucking';
import TabLolo from './tabs/TabLolo';
import TabDepo from './tabs/TabDepo';
import TabLinePerizinan from './tabs/TabLinePerizinan';
import TabOtherCost from './tabs/TabOtherCost';
import TabClaimEvaluasi from './tabs/TabClaimEvaluasi';
import TabRingkasan from './tabs/TabRingkasan';

const TABS = [
  'Identitas & Tracking',
  'Trucking',
  'LOLO',
  'Depo',
  'Line & PIB',
  'Other Cost',
  'Claim & Evaluasi',
  'Ringkasan'
];

const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { shipments, getShipmentById, updateShipmentIdentity, updateShipmentCosts, updateShipmentContainers, fetchShipments } = useImportOperationalStore();
  
  const shipment = getShipmentById(id);
  
  // Hitung index iterasi sesuai urutan di tabel List (descending)
  const sortedShipments = [...shipments].sort((a, b) => b.id - a.id);
  const displayIndex = sortedShipments.findIndex(s => String(s.id) === String(id)) + 1;

  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'

  // Ref to suppress draft resets during save operation
  const isSavingRef = useRef(false);
  
  // Local drafts for 24 cost categories and tracking
  const [draftCosts, setDraftCosts] = useState(null);
  const [draftContainers, setDraftContainers] = useState(null);
  const [draftIdentity, setDraftIdentity] = useState(null);
  const [globalContainerCosts, setGlobalContainerCosts] = useState([]);

  useEffect(() => {
    if (shipments.length === 0) {
      fetchShipments();
    }
  }, [shipments.length, fetchShipments]);

  // Prevent drafts from resetting during save or when re-fetching the same shipment (causes blinking)
  const currentShipmentIdRef = useRef(null);

  // Initialize drafts only when shipment loads for the first time for a given ID
  useEffect(() => {
    // Wait until saving is completely finished before resetting drafts
    if (isSaving) return;
    
    // Only set draft if it's a new shipment being loaded to avoid blinking/resetting inputs on save
    if (shipment && currentShipmentIdRef.current !== shipment.id) {
      currentShipmentIdRef.current = shipment.id;
      
      setDraftCosts(JSON.parse(JSON.stringify(mergeShipmentCosts(shipment.costs))));
      setDraftContainers(JSON.parse(JSON.stringify(shipment.containers || [])));
      setDraftIdentity({
        un: shipment.un, kat: shipment.kat, supplier: shipment.supplier,
        trade: shipment.trade || '',
        shipmentTerm: shipment.shipmentTerm || '',
        inv: shipment.inv, 
        blSwbAwb: shipment.blSwbAwb,
        etd: shipment.etd || '',
        eta: shipment.eta || '',
        atd: shipment.atd || '',
        ata: shipment.ata || '',
        hsCode: shipment.hsCode || '',
        freeTimeDest: shipment.freeTimeDest || 0,
        modeTransport: shipment.modeTransport,
        qtty: shipment.qtty,
        qttyUom: shipment.qttyUom, depo: shipment.depo, gudang: shipment.gudang,
        importProjectId: shipment.importProjectId,
      });
    }
  }, [shipment, isSaving]);

  useEffect(() => {
    const fetchContainerCosts = async () => {
      try {
        const data = await api(`/import-shipments/${id}/container-costs`);
        if (Array.isArray(data)) setGlobalContainerCosts(data);
      } catch (err) {
        console.error('Failed to fetch global container costs:', err);
      }
    };
    if (id) fetchContainerCosts();
  }, [id]);

  const updateContainerCost = useCallback((newCost, isDelete = false) => {
    setGlobalContainerCosts(prev => {
      const idx = prev.findIndex(c => 
        (c.id && c.id === newCost.id) || 
        (c._tempId && c._tempId === newCost._tempId) || 
        (c.container_id === newCost.container_id && c.cost_category === newCost.cost_category && !c._tempId && !c.id)
      );
      
      if (isDelete) {
        if (idx >= 0) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        return prev;
      }

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newCost;
        return next;
      }
      return [...prev, newCost];
    });
  }, []);

  if (!shipment || !draftCosts || !draftContainers || !draftIdentity) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink-muted-48)' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⏳</div>
        <h3 style={{ margin: 0, fontWeight: 600, color: 'var(--color-ink)' }}>Memuat Data Shipment...</h3>
        <p style={{ marginTop: '8px', fontSize: '14px' }}>Mohon tunggu sebentar, data sedang dipersiapkan.</p>
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const totals = calcTotals(draftCosts, draftIdentity.qtty, globalContainerCosts);

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    isSavingRef.current = true; // Block useEffect from resetting drafts

    try {
      // Run saves sequentially to avoid race conditions
      await updateShipmentIdentity(id, draftIdentity);
      const idMapping = await updateShipmentContainers(id, draftContainers);
      await updateShipmentCosts(id, draftCosts);

      // Save all global container costs
      for (const cost of globalContainerCosts) {
        const payload = { ...cost };
        if (idMapping && idMapping[payload.container_id]) {
          payload.container_id = idMapping[payload.container_id];
        }
        
        if (payload.container_id && String(payload.container_id).startsWith('temp-')) continue;
        
        const method = payload.id ? 'PATCH' : 'POST';
        const endpoint = payload.id ? `/container-costs/${payload.id}` : `/container-costs`;
        await api(endpoint, { method, body: JSON.stringify(payload) });
      }

      await fetchShipments(); // Refresh to calculate new grand totals
      
      const updatedCosts = await api(`/import-shipments/${id}/container-costs`);
      if (Array.isArray(updatedCosts)) setGlobalContainerCosts(updatedCosts);

      // --- SYNC TO FINANCIAL REQUEST (API INSTEAD OF MOCK) ---
      const joGroups = {}; 
      
      (Array.isArray(updatedCosts) ? updatedCosts : []).forEach(c => {
        if (!c.inv_no || !c.inv_no.trim()) return;
        
        let vendor = c.vendor_name || 'Unknown';
        if (c.cost_category === 'DEPO') {
          const cont = draftContainers.find(x => x.id === c.container_id);
          vendor = cont?.depo_route || 'Unknown Depo';
        }
        
        const key = `${vendor}|${c.inv_no}`;
        if (!joGroups[key]) {
          let categoryName = c.cost_category;
          if (c.cost_category === 'OTHE (Other Cost)') {
            categoryName = c.jenis_cost === 'PERIZINAN' ? 'OTHE (Perizinan)' : 'OTHE (Other Cost)';
          }
          
          joGroups[key] = {
            key: `INV_${c.inv_no.replace(/[^a-zA-Z0-9]/g, '')}_${vendor.replace(/[^a-zA-Z0-9]/g, '')}`,
            name: categoryName,
            inv: c.inv_no,
            vendor: vendor,
            dpp: 0,
            persenPpn: Number(c.persen_ppn) || 0,
            ppn: 0,
            totalDenganPpn: 0,
          };
        }
        
        const dpp = Number(c.dpp || c.dpp_auto) || 0;
        const ppn = Number(c.ppn_auto || c.ppn) || 0;
        const total = Number(c.total) || (dpp + ppn);
        
        joGroups[key].dpp += dpp;
        joGroups[key].ppn += ppn;
        joGroups[key].totalDenganPpn += total;
      });
      
      const categoriesToSync = Object.values(joGroups);
      
      if (categoriesToSync.length > 0) {
        await api('/job-orders/sync-import', {
          method: 'POST',
          body: JSON.stringify({
            importShipmentId: id,
            shipmentUn: draftIdentity.un,
            activeCategories: categoriesToSync
          })
        });
      }
      
      // Fetch fresh job orders so UI reflects reality
      usePaymentStore.getState().fetchJobOrders();
      // ---------------------------------

      // Update local drafts with fresh data from backend so new IDs (e.g. for containers) appear immediately without manual refresh
      const freshShipment = useImportOperationalStore.getState().shipments.find(s => String(s.id) === String(id));
      if (freshShipment) {
        setDraftContainers(JSON.parse(JSON.stringify(freshShipment.containers || [])));
        setDraftCosts(JSON.parse(JSON.stringify(mergeShipmentCosts(freshShipment.costs))));
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      isSavingRef.current = false; // Allow useEffect again after save
      setIsSaving(false);
    }
  };

  const updateCost = (category, field, value) => {
    setDraftCosts(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const KatBadge = ({ kat }) => {
    const map = {
      'RM':        { bg: '#e5f1fc', color: '#0066cc' },
      'Ind. Food': { bg: '#e7f8ec', color: '#34c759' },
      'Ind. Pckg': { bg: '#fff2e0', color: '#ff9500' },
      'Aset':      { bg: '#f3effe', color: '#5856d6' },
      'Misc':      { bg: '#f0f0f0', color: '#7a7a7a' },
      'Reim':      { bg: '#ffe9e8', color: '#ff3b30' },
      'Reex':      { bg: '#ffe9e8', color: '#af52de' },
    };
    const style = map[kat] || { bg: '#f0f0f0', color: '#7a7a7a' };
    return (
      <span style={{
        backgroundColor: style.bg, color: style.color,
        fontSize: '12px', fontWeight: '700', padding: '4px 10px',
        borderRadius: 'var(--rounded-pill)', whiteSpace: 'nowrap',
      }}>
        {kat}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)' }}>
      
      {/* Sticky Header */}
      <div style={{
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Top bar (Back + Title + Save) */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 32px 12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/workspace/import-operational')}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: '1px solid var(--color-hairline)',
                backgroundColor: 'var(--color-canvas)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-ink-muted-80)'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas)'}
            >
              <ArrowLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-ink)', letterSpacing: '-0.374px' }}>
                [{displayIndex > 0 ? displayIndex : shipment.id}] {draftIdentity.un || 'Tanpa UN'} · {draftIdentity.supplier || 'Tanpa Supplier'}
              </h1>
              <KatBadge kat={draftIdentity.kat} />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Grand Total (+Tax)
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>
                Rp {fmtRupiah(totals.grandTotal)}
              </div>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: 'var(--rounded-pill)',
                border: 'none',
                backgroundColor: saveStatus === 'success' ? '#34c759' : saveStatus === 'error' ? '#ff3b30' : 'var(--color-primary)',
                color: '#fff', fontSize: '14px', fontWeight: '600', cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                fontFamily: 'var(--font-family-body)',
                transition: 'background-color 0.3s',
              }}
            >
              {saveStatus === 'success' ? <CheckCircle size={16} /> : <Save size={16} />}
              {isSaving ? 'Menyimpan...' : saveStatus === 'success' ? 'Tersimpan!' : saveStatus === 'error' ? 'Gagal!' : 'Simpan Semua'}
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', padding: '0 32px', gap: '4px', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '10px 14px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === t ? 'var(--color-primary)' : 'var(--color-ink-muted-80)',
                fontSize: '13px', fontWeight: activeTab === t ? '600' : '400',
                borderBottom: activeTab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
                cursor: 'pointer', fontFamily: 'var(--font-family-body)',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {activeTab === 'Identitas & Tracking' && (
            <TabIdentitas
              identity={draftIdentity} setIdentity={setDraftIdentity}
              containers={draftContainers} setContainers={setDraftContainers}
            />
          )}
          
          {activeTab === 'Trucking' && (
            <TabTrucking shipmentId={id} containers={draftContainers} updateContainerCost={updateContainerCost} />
          )}
          
          {activeTab === 'LOLO' && (
            <TabLolo shipmentId={id} containers={draftContainers} updateContainerCost={updateContainerCost} />
          )}

          {activeTab === 'Depo' && (
            <TabDepo shipmentId={id} containers={draftContainers} updateContainerCost={updateContainerCost} freeTime={draftIdentity.freeTimeDest} />
          )}

          {activeTab === 'Line & PIB' && (
            <TabLinePerizinan shipmentId={id} costs={draftCosts} updateCost={updateCost} totals={totals} generatedRequestIds={shipment.generatedRequestIds} updateContainerCost={updateContainerCost} />
          )}

          {activeTab === 'Other Cost' && (
            <TabOtherCost shipmentId={id} costs={draftCosts} updateCost={updateCost} totals={totals} generatedRequestIds={shipment.generatedRequestIds} updateContainerCost={updateContainerCost} />
          )}

          {activeTab === 'Claim & Evaluasi' && (
            <TabClaimEvaluasi shipmentId={id} importProjectId={draftIdentity.importProjectId} costs={draftCosts} updateCost={updateCost} totals={totals} qtty={draftIdentity.qtty} />
          )}

          {activeTab === 'Ringkasan' && (
            <TabRingkasan shipmentId={id} containers={draftContainers} totals={totals} qtty={draftIdentity.qtty} globalContainerCosts={globalContainerCosts} />
          )}

        </div>
      </div>
    </div>
  );
};

export default ShipmentDetail;
