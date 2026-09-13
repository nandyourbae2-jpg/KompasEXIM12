import React, { useState, useEffect } from 'react';
import TabMtb from './TabMtb';
import TabPib from './TabPib';
import TabMtbDetail from './TabMtbDetail';

const RealisasiDanaLayout = () => {
  const [activeTab, setActiveTab] = useState('MTB');
  const [activeMtbPeriodeId, setActiveMtbPeriodeId] = useState(null);

  // If a detail view is active, render it instead of the layout tabs
  if (activeMtbPeriodeId) {
    return (
      <TabMtbDetail 
        periodeId={activeMtbPeriodeId} 
        onBack={() => setActiveMtbPeriodeId(null)} 
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)', fontFamily: 'var(--font-family-body)' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px 0px', backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', flexShrink: 0 }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: '28px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 4px 0', letterSpacing: '-0.374px' }}>
            Realisasi Dana Import
          </h1>
          <p style={{ margin: 0, color: 'var(--color-ink-muted-80)', fontSize: '14px' }}>
            Monitoring buku kas operasional (Realisasi MTB) dan settlement bea masuk (Realisasi PIB).
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <button
            onClick={() => setActiveTab('MTB')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'MTB' ? '2px solid var(--color-primary)' : '2px solid transparent',
              padding: '0 0 16px 0',
              fontSize: '14px',
              fontWeight: activeTab === 'MTB' ? '600' : '500',
              color: activeTab === 'MTB' ? 'var(--color-primary)' : 'var(--color-ink-muted-48)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-1px'
            }}
          >
            Realisasi MTB
          </button>
          <button
            onClick={() => setActiveTab('PIB')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'PIB' ? '2px solid var(--color-primary)' : '2px solid transparent',
              padding: '0 0 16px 0',
              fontSize: '14px',
              fontWeight: activeTab === 'PIB' ? '600' : '500',
              color: activeTab === 'PIB' ? 'var(--color-primary)' : 'var(--color-ink-muted-48)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-1px'
            }}
          >
            Realisasi PIB
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
      {activeTab === 'MTB' && (
        <TabMtb onOpenDetail={(id) => setActiveMtbPeriodeId(id)} />
      )}
      {activeTab === 'PIB' && (
        <TabPib />
      )}
    </div>
    </div>
  );
};

export default RealisasiDanaLayout;
