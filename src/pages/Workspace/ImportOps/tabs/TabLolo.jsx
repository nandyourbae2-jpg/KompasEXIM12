import React, { useState, useEffect } from 'react';
import ContainerCostCard from '../../../../components/ContainerCostCard';
import FlexibleCostSection from '../../../../components/FlexibleCostSection';
import api from '../../../../lib/api';

const TabLolo = ({ shipmentId, containers = [], updateContainerCost }) => {
  const [costs, setCosts] = useState({});
  const [generalCosts, setGeneralCosts] = useState({
    'LOLO (Port)': [],
    'LOLO (Hico/Bahandel)': [],
    'LOLO (Gudang Port)': [],
    'LOLO (Extending Port)': []
  });
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const load = async () => {
      const allCosts = await api(`/import-shipments/${shipmentId}/container-costs`);
      const grouped = {};
      const genCosts = {
        'LOLO (Port)': [],
        'LOLO (Hico/Bahandel)': [],
        'LOLO (Gudang Port)': [],
        'LOLO (Extending Port)': []
      };
      (Array.isArray(allCosts) ? allCosts : []).forEach(c => {
        if (c.container_id) {
          if (!grouped[c.container_id]) grouped[c.container_id] = {};
          grouped[c.container_id][c.cost_category] = c;
        } else {
          if (genCosts[c.cost_category]) genCosts[c.cost_category].push(c);
        }
      });
      setCosts(grouped);
      setGeneralCosts(genCosts);

      if (containers.length > 0) setExpanded({ [containers[0].id]: true });
    };
    if (shipmentId) load();
  }, [shipmentId, containers.map(c => c.id).join(',')]);

  let grandTotalLanded = 0;
  let grandTotalPlusTax = 0;

  Object.values(costs).forEach(contCosts => {
    grandTotalLanded += (contCosts['LOLO (Reimb. Lift Off)']?.dpp || 0);
    grandTotalPlusTax += (contCosts['LOLO (Reimb. Lift Off)']?.total || 0);
  });

  Object.values(generalCosts).forEach(arr => {
    arr.forEach(c => {
      grandTotalLanded += (Number(c.dpp) || 0);
      grandTotalPlusTax += (Number(c.total) || 0);
    });
  });

  return (
    <div style={{ padding: '0 8px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--color-ink)' }}>A. Biaya Per-Container (Reimb. Lift Off)</h3>
      {containers.map((container, idx) => {
        if (!container.id) {
          return (
            <div key={`unsaved-${idx}`} style={{ padding: '24px', textAlign: 'center', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca' }}>
              <strong>Kontainer {idx + 1} belum tersimpan.</strong><br/>
              Silakan klik tombol <b>"Simpan Semua"</b> di kanan atas terlebih dahulu untuk menyimpan identitas kontainer ini, baru Anda dapat mengisi biayanya.
            </div>
          );
        }
        return (
          <ContainerCostCard
            key={container.id}
            container={container}
            idx={idx}
            costs={costs[container.id] || {}}
            isExpanded={!!expanded[container.id]}
            onToggle={() => setExpanded(p => ({ ...p, [container.id]: !p[container.id] }))}
            shipmentId={shipmentId}
            tab="LOLO"
            onCostUpdate={(newCost) => {
              setCosts(p => ({
                ...p,
                [container.id]: { ...(p[container.id] || {}), [newCost.cost_category]: newCost }
              }));
              if (updateContainerCost) updateContainerCost(newCost);
            }}
          />
        );
      })}

      {containers.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted-48)', border: '1px dashed var(--color-hairline)', borderRadius: '8px' }}>
          Belum ada kontainer. Silakan tambahkan kontainer di tab Kontainer.
        </div>
      )}

      <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '32px 0 16px', color: 'var(--color-ink)' }}>B. Biaya General (Di Luar Container)</h3>
      
      <FlexibleCostSection
        title="LOLO Port" category="LOLO (Port)" shipmentId={shipmentId}
        costs={generalCosts['LOLO (Port)']}
        fields={['vendor_name', 'inv_no', 'gp_no', 'dpp', 'persen_ppn', 'no_fp', 'ppn_auto']}
        onUpdateLocal={(newArr) => setGeneralCosts(p => ({ ...p, 'LOLO (Port)': newArr }))}
        updateContainerCost={updateContainerCost}
      />
      <FlexibleCostSection
        title="Hico / Bahandel" category="LOLO (Hico/Bahandel)" shipmentId={shipmentId}
        costs={generalCosts['LOLO (Hico/Bahandel)']}
        fields={['vendor_name', 'inv_no', 'dpp', 'persen_ppn', 'no_fp', 'ppn_auto']}
        onUpdateLocal={(newArr) => setGeneralCosts(p => ({ ...p, 'LOLO (Hico/Bahandel)': newArr }))}
        updateContainerCost={updateContainerCost}
      />
      <FlexibleCostSection
        title="LOLO Gudang Port" category="LOLO (Gudang Port)" shipmentId={shipmentId}
        costs={generalCosts['LOLO (Gudang Port)']}
        fields={['vendor_name', 'inv_no', 'dpp', 'persen_ppn', 'no_fp', 'ppn_auto']}
        onUpdateLocal={(newArr) => setGeneralCosts(p => ({ ...p, 'LOLO (Gudang Port)': newArr }))}
        updateContainerCost={updateContainerCost}
      />
      <FlexibleCostSection
        title="LOLO Extending Port" category="LOLO (Extending Port)" shipmentId={shipmentId}
        costs={generalCosts['LOLO (Extending Port)']}
        fields={['vendor_name', 'inv_no', 'dpp', 'persen_ppn', 'no_fp', 'ppn_auto']}
        onUpdateLocal={(newArr) => setGeneralCosts(p => ({ ...p, 'LOLO (Extending Port)': newArr }))}
        updateContainerCost={updateContainerCost}
      />

      <div style={{
        background: 'var(--color-ink)', color: 'white', borderRadius: 'var(--rounded-lg)',
        padding: '24px', marginTop: '24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8, letterSpacing: '0.5px' }}>
            TOTAL LOLO KESELURUHAN (PER-CONTAINER & GENERAL)
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '18px' }}>
            Landed: <strong>Rp {grandTotalLanded.toLocaleString('id-ID')}</strong>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8, letterSpacing: '0.5px' }}>GRAND TOTAL (+TAX)</p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: '800', color: '#38bdf8' }}>
            Rp {grandTotalPlusTax.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TabLolo;
