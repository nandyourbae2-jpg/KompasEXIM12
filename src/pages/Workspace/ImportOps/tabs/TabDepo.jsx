import React, { useState, useEffect } from 'react';
import ContainerCostCard from '../../../../components/ContainerCostCard';
import useImportOperationalStore from '../../../../store/useImportOperationalStore';
import api from '../../../../lib/api';

const TabDepo = ({ shipmentId, containers = [], updateContainerCost, freeTime }) => {
  const [costs, setCosts] = useState({});
  const [expanded, setExpanded] = useState({});
  const { masterData } = useImportOperationalStore();

  useEffect(() => {
    const load = async () => {
      const allCosts = await api(`/import-shipments/${shipmentId}/container-costs`);
      const grouped = {};
      (Array.isArray(allCosts) ? allCosts : []).forEach(c => {
        if (!grouped[c.container_id]) grouped[c.container_id] = {};
        grouped[c.container_id][c.cost_category] = c;
      });
      setCosts(grouped);
      if (containers.length > 0) setExpanded({ [containers[0].id]: true });
    };
    if (shipmentId) load();
  }, [shipmentId, containers.map(c => c.id).join(',')]);

  const grandTotalLanded = Object.values(costs).reduce((sum, contCosts) => {
    return sum + (contCosts['DEPO']?.dpp || 0);
  }, 0);

  const grandTotalPlusTax = Object.values(costs).reduce((sum, contCosts) => {
    return sum + (contCosts['DEPO']?.total || 0);
  }, 0);

  return (
    <div style={{ padding: '0 8px' }}>
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
            tab="DEPO"
            onCostUpdate={(newCost) => {
              setCosts(p => ({
                ...p,
                [container.id]: { ...(p[container.id] || {}), [newCost.cost_category]: newCost }
              }));
              if (updateContainerCost) updateContainerCost(newCost);
            }}
            depoRoute={container.depo_route}
            depoPrices={masterData.depoPrices}
            freeTime={freeTime}
          />
        );
      })}

      {containers.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted-48)', border: '1px dashed var(--color-hairline)', borderRadius: '8px' }}>
          Belum ada kontainer. Silakan tambahkan kontainer di tab Kontainer.
        </div>
      )}

      {/* Grand Total Bar */}
      <div style={{
        background: 'var(--color-ink)',
        color: 'white',
        borderRadius: 'var(--rounded-lg)',
        padding: '24px',
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8, letterSpacing: '0.5px' }}>
            TOTAL DEPO SEMUA KONTAINER
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

export default TabDepo;
