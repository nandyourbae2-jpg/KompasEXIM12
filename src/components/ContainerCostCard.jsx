import React from 'react';
import CostInputSection from './CostInputSection';

const ContainerCostCard = ({ container, idx, costs, isExpanded, onToggle, shipmentId, tab, onCostUpdate, depoRoute, depoPrices, freeTime }) => {
  const containerLabel = `KONTAINER ${idx + 1} — ${container.cont || container.no_kontainer || 'Tanpa Nomor'}`;

  let totalContainerLanded = 0;
  let totalContainerPlusTax = 0;

  if (tab === 'TRUCKING') {
    totalContainerLanded =
      (costs['TRUC (Repo Depo)']?.dpp || 0) +
      (costs['TRUC (Warehouse)']?.dpp || 0);
    totalContainerPlusTax =
      (costs['TRUC (Repo Depo)']?.total || 0) +
      (costs['TRUC (Warehouse)']?.total || 0);
  } else if (tab === 'LOLO') {
    totalContainerLanded = (costs['LOLO (Reimb. Lift Off)']?.dpp || 0);
    totalContainerPlusTax = (costs['LOLO (Reimb. Lift Off)']?.total || 0);
  } else if (tab === 'DEPO') {
    totalContainerLanded = (costs['DEPO']?.dpp || 0);
    totalContainerPlusTax = (costs['DEPO']?.total || 0);
  }

  return (
    <div style={{
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--rounded-lg)',
      marginBottom: '16px',
      overflow: 'hidden',
      backgroundColor: 'var(--color-canvas)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px',
          background: isExpanded ? 'var(--color-status-info-bg)' : 'var(--color-canvas)',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid var(--color-hairline)' : 'none',
          transition: 'background 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📦</span>
          <strong style={{ fontSize: '15px', color: 'var(--color-ink)' }}>{containerLabel}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {totalContainerPlusTax > 0 && (
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>
              Total: Rp {totalContainerPlusTax.toLocaleString('id-ID')}
            </span>
          )}
          <span style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 'bold' }}>
            {isExpanded ? 'Tutup ▲' : 'Buka ▼'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '20px' }}>
          {tab === 'TRUCKING' && (
            <>
              <CostInputSection
                title="TRUC (Repo Depo)"
                containerId={container.id}
                shipmentId={shipmentId}
                category="TRUC (Repo Depo)"
                existing={costs['TRUC (Repo Depo)']}
                fields={['vendor_name', 'inv_no', 'dpp', 'persen_ppn', 'ppn_auto', 'no_fp']}
                onSave={onCostUpdate}
                onLiveUpdate={onCostUpdate}
              />
              <CostInputSection
                title="TRUC (Warehouse)"
                containerId={container.id}
                shipmentId={shipmentId}
                category="TRUC (Warehouse)"
                existing={costs['TRUC (Warehouse)']}
                fields={['vendor_name', 'inv_no', 'biaya_dasar', 'inap_sasis', 'other_cost', 'ket_other', 'dpp_auto', 'persen_ppn', 'ppn_auto', 'no_fp']}
                onSave={onCostUpdate}
                onLiveUpdate={onCostUpdate}
              />
            </>
          )}

          {tab === 'LOLO' && (
            <>
              <CostInputSection
                title="LOLO (Reimb. Lift Off)"
                containerId={container.id}
                shipmentId={shipmentId}
                category="LOLO (Reimb. Lift Off)"
                existing={costs['LOLO (Reimb. Lift Off)']}
                fields={['vendor_name', 'inv_no', 'dpp', 'persen_ppn', 'ppn_auto', 'no_fp']}
                onSave={onCostUpdate}
                onLiveUpdate={onCostUpdate}
              />
            </>
          )}

          {tab === 'DEPO' && (
            <CostInputSection
              title="DEPO"
              containerId={container.id}
              shipmentId={shipmentId}
              category="DEPO"
              existing={costs['DEPO']}
              fields={['vendor_name', 'inv_no', 'calc_day', 'calc_shift', 'act_day', 'act_shift', 'storage', 'monitoring', 'recooling', 'lolo_depo', 'dpp_auto', 'persen_ppn', 'ppn_auto', 'no_fp']}
              onSave={onCostUpdate}
              onLiveUpdate={onCostUpdate}
              depoRoute={depoRoute}
              depoPrices={depoPrices}
              freeTime={freeTime}
              depoArrival={container.truRepoArrival}
              depoDepart={container.truRepoDepart}
            />
          )}

          <div style={{
            background: 'var(--color-status-info-bg)',
            borderRadius: 'var(--rounded-md)',
            padding: '14px 18px',
            marginTop: '20px',
            display: 'flex', justifyContent: 'space-between',
            border: '1px solid #bfdbfe'
          }}>
            <span style={{ fontSize: '14px', color: 'var(--color-status-info)', fontWeight: '600' }}>
              {tab} LANDED — {container.cont || container.no_kontainer || 'Tanpa Nomor'}
            </span>
            <strong style={{ color: 'var(--color-status-info)', fontSize: '15px' }}>
              Rp {totalContainerLanded.toLocaleString('id-ID')}
            </strong>
          </div>
          
          <div style={{
            background: 'var(--color-ink)',
            color: 'white',
            borderRadius: 'var(--rounded-md)',
            padding: '14px 18px',
            marginTop: '8px',
            display: 'flex', justifyContent: 'space-between',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
              TOTAL {tab} +TAX — {container.cont || container.no_kontainer || 'Tanpa Nomor'}
            </span>
            <strong style={{ fontSize: '16px' }}>
              Rp {totalContainerPlusTax.toLocaleString('id-ID')}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContainerCostCard;
