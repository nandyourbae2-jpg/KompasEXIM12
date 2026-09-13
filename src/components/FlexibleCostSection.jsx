import React, { useState, useEffect } from 'react';
import CostSection from './CostSection';
import CostInputSection from './CostInputSection';
import { Plus, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useAppleModal } from '../contexts/AppleModalContext';

const FlexibleCostSection = ({ title, category, shipmentId, costs, fields, onUpdateLocal, totalLabel, updateContainerCost }) => {
  // We keep a local state of items to easily append new ones before they are saved to DB.
  const [items, setItems] = useState([]);
  const { confirm, alert } = useAppleModal();

  useEffect(() => {
    setItems(costs || []);
  }, [costs]);

  const handleAdd = () => {
    setItems(prev => [...prev, { _tempId: Date.now(), isNew: true }]);
  };

  const handleRemove = async (idx, item) => {
    // If it's already in DB, call DELETE API
    if (item.id) {
      if (!(await confirm('Hapus biaya ini?'))) return;
      try {
        await api(`/container-costs/${item.id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Gagal menghapus biaya', e);
        return;
      }
    }
    
    // Remove from local state
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);

    // Notify parent to update totals if needed
    if (onUpdateLocal) {
      onUpdateLocal(newItems);
    }
    if (updateContainerCost) {
      updateContainerCost(item, true); // True for delete
    }
  };

  const handleSaveItem = (idx, savedItem) => {
    const newItems = [...items];
    newItems[idx] = savedItem;
    setItems(newItems);
    if (onUpdateLocal) {
      onUpdateLocal(newItems);
    }
    if (updateContainerCost) {
      updateContainerCost(savedItem);
    }
  };

  const totalDpp = items.reduce((sum, item) => sum + (Number(item.dpp) || 0), 0);
  const totalAll = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  return (
    <CostSection title={title} total={totalAll} totalLabel={totalLabel || `Total ${title} (+PPN)`}>
      {items.map((item, idx) => (
        <div key={item.id || item._tempId} style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
            {item.can_delete !== false ? (
              <button
                onClick={() => handleRemove(idx, item)}
                style={{
                  background: 'var(--color-status-danger-bg)', border: 'none',
                  color: 'var(--color-status-danger)', padding: '6px',
                  borderRadius: '6px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Hapus form ini"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', padding: '6px', fontWeight: '500' }}>
                🔒 Terkunci (Ledger Aktif)
              </span>
            )}
          </div>
          
          <CostInputSection
            costId={item.id}
            containerId={null} // NULL = General Cost
            shipmentId={shipmentId}
            category={category}
            title={`Form ${idx + 1}`}
            fields={fields}
            existing={item}
            onSave={(saved) => handleSaveItem(idx, saved)}
            onLiveUpdate={(saved) => handleSaveItem(idx, saved)}
          />
        </div>
      ))}

      <button
        onClick={handleAdd}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', padding: '12px',
          background: 'transparent', border: '2px dashed var(--color-hairline)',
          borderRadius: '8px', color: 'var(--color-ink-muted-80)',
          fontWeight: '600', fontSize: '13px', cursor: 'pointer',
          justifyContent: 'center', transition: 'all 0.2s'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--color-primary)';
          e.currentTarget.style.color = 'var(--color-primary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--color-hairline)';
          e.currentTarget.style.color = 'var(--color-ink-muted-80)';
        }}
      >
        <Plus size={16} />
        Tambah {title}
      </button>
    </CostSection>
  );
};

export default FlexibleCostSection;
