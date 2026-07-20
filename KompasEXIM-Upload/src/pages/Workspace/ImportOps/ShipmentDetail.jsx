import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import useImportOperationalStore from '../../../store/useImportOperationalStore';
import { calcTotals, fmtRupiah } from '../../../utils/importCalc';

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
  'Line & Perizinan',
  'Other Cost',
  'Claim & Evaluasi',
  'Ringkasan'
];

const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getShipmentById, updateShipmentIdentity, updateShipmentCosts, updateShipmentContainers } = useImportOperationalStore();
  
  const shipment = getShipmentById(id);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local drafts for 24 cost categories and tracking
  const [draftCosts, setDraftCosts] = useState(null);
  const [draftContainers, setDraftContainers] = useState(null);
  const [draftIdentity, setDraftIdentity] = useState(null);

  useEffect(() => {
    if (shipment) {
      // Deep copy to prevent mutating store directly
      setDraftCosts(JSON.parse(JSON.stringify(shipment.costs)));
      setDraftContainers(JSON.parse(JSON.stringify(shipment.containers || [])));
      setDraftIdentity({
        un: shipment.un, kat: shipment.kat, supplier: shipment.supplier,
        trade: shipment.trade || '',
        shipmentTerm: shipment.shipmentTerm || '',
        inv: shipment.inv, 
        blSwbAwb: shipment.blSwbAwb,
        etd: shipment.etd || '',
        eta: shipment.eta,
        hsCode: shipment.hsCode || '',
        freeTimeDest: shipment.freeTimeDest || 0,
        modeTransport: shipment.modeTransport,
        qtty: shipment.qtty,
        qttyUom: shipment.qttyUom, depo: shipment.depo, gudang: shipment.gudang,
        importProjectId: shipment.importProjectId,
      });
    }
  }, [shipment]);

  if (!shipment || !draftCosts || !draftContainers || !draftIdentity) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
        Memuat data shipment...
      </div>
    );
  }

  const totals = calcTotals(draftCosts, draftIdentity.qtty);

  const handleSaveAll = () => {
    setIsSaving(true);
    // Update store
    updateShipmentIdentity(id, draftIdentity);
    updateShipmentContainers(id, draftContainers);
    updateShipmentCosts(id, draftCosts);
    
    setTimeout(() => {
      setIsSaving(false);
      // Optional: show a toast here. For now, it just ends the saving state.
    }, 400);
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
                [{shipment.id}] {draftIdentity.un || 'Tanpa UN'} · {draftIdentity.supplier || 'Tanpa Supplier'}
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
                border: 'none', backgroundColor: 'var(--color-primary)',
                color: '#fff', fontSize: '14px', fontWeight: '600', cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                fontFamily: 'var(--font-family-body)',
              }}
            >
              <Save size={16} />
              {isSaving ? 'Menyimpan...' : 'Simpan Semua'}
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
            <TabTrucking shipmentId={id} costs={draftCosts} updateCost={updateCost} totals={totals} />
          )}
          
          {activeTab === 'LOLO' && (
            <TabLolo shipmentId={id} costs={draftCosts} updateCost={updateCost} totals={totals} />
          )}

          {activeTab === 'Depo' && (
            <TabDepo shipmentId={id} costs={draftCosts} updateCost={updateCost} totals={totals} />
          )}

          {activeTab === 'Line & Perizinan' && (
            <TabLinePerizinan shipmentId={id} costs={draftCosts} updateCost={updateCost} totals={totals} />
          )}

          {activeTab === 'Other Cost' && (
            <TabOtherCost shipmentId={id} costs={draftCosts} updateCost={updateCost} totals={totals} />
          )}

          {activeTab === 'Claim & Evaluasi' && (
            <TabClaimEvaluasi shipmentId={id} costs={draftCosts} updateCost={updateCost} totals={totals} qtty={draftIdentity.qtty} />
          )}

          {activeTab === 'Ringkasan' && (
            <TabRingkasan shipmentId={id} totals={totals} qtty={draftIdentity.qtty} containers={draftContainers} />
          )}

        </div>
      </div>
    </div>
  );
};

export default ShipmentDetail;
