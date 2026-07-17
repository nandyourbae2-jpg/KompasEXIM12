import React, { useState, useMemo } from 'react';
import useImportOperationalStore from '../../../store/useImportOperationalStore';
import usePaymentStore from '../../../store/usePaymentStore';
import { hitungStage } from '../../../utils/statusShipmentCalc';
import StatusShipmentModal from './StatusShipmentModal';

import { fmtRupiah } from '../../../utils/importCalc';

const COLUMNS = [
  'Shipment Active',
  'Delivery Active',
  'Financial Settlement',
  'Status Complete'
];

const STAGE_STYLES = {
  'Shipment Active': { color: 'var(--color-status-info)', bg: 'var(--color-status-info-bg)' },
  'Delivery Active': { color: 'var(--color-status-warning)', bg: 'var(--color-status-warning-bg)' },
  'Financial Settlement': { color: '#d97706', bg: '#fef3c7' }, // Custom darker warning
  'Status Complete': { color: 'var(--color-status-success)', bg: 'var(--color-status-success-bg)' }
};

const StatusShipmentPage = () => {
  const { shipments } = useImportOperationalStore();
  const { jobOrders } = usePaymentStore();

  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedStage, setSelectedStage] = useState('');

  // Hitung stage untuk semua shipment secara otomatis setiap ada perubahan data
  const shipmentsWithStage = useMemo(() => {
    return shipments.map(s => {
      const stage = hitungStage(s, jobOrders);
      return { ...s, calculatedStage: stage };
    });
  }, [shipments, jobOrders]);

  // Kelompokkan shipment berdasarkan stage
  const groupedShipments = useMemo(() => {
    const groups = {
      'Shipment Active': [],
      'Delivery Active': [],
      'Financial Settlement': [],
      'Status Complete': []
    };
    
    shipmentsWithStage.forEach(s => {
      if (groups[s.calculatedStage]) {
        groups[s.calculatedStage].push(s);
      }
    });
    
    return groups;
  }, [shipmentsWithStage]);

  const handleCardClick = (shipment, stage) => {
    setSelectedShipment(shipment);
    setSelectedStage(stage);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: '24px 32px', backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600', letterSpacing: '-0.374px', color: 'var(--color-ink)' }}>
          Status Shipment
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-ink-muted-48)' }}>
          Papan visualisasi otomatis lifecycle B/L. Kartu berpindah secara real-time berdasarkan data operasional dan finansial.
        </p>
      </div>

      {/* Kanban Board */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '24px 32px' }}>
        <div style={{ display: 'flex', gap: '24px', height: '100%', minWidth: 'min-content' }}>
          
          {COLUMNS.map(colName => {
            const items = groupedShipments[colName] || [];
            
            return (
              <div key={colName} style={{ 
                width: '320px', display: 'flex', flexDirection: 'column', 
                backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', 
                border: '1px solid var(--color-hairline)', flexShrink: 0, maxHeight: '100%' 
              }}>
                {/* Column Header */}
                <div style={{ 
                  padding: '16px', 
                  borderBottom: `2px solid ${STAGE_STYLES[colName].color}`, 
                  backgroundColor: STAGE_STYLES[colName].bg,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderTopLeftRadius: 'var(--rounded-lg)', borderTopRightRadius: 'var(--rounded-lg)'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: STAGE_STYLES[colName].color }}>{colName}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-canvas)', backgroundColor: STAGE_STYLES[colName].color, padding: '2px 8px', borderRadius: 'var(--rounded-pill)' }}>
                    {items.length}
                  </div>
                </div>

                {/* Column Cards */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {items.map(shipment => {
                    const daysInStage = shipment.updatedAt 
                      ? Math.floor((new Date() - new Date(shipment.updatedAt)) / (1000 * 60 * 60 * 24)) 
                      : 0;
                    
                    let progressIndicator = null;
                    if (colName === 'Delivery Active') {
                      const totalCont = shipment.containers?.length || 0;
                      const completedCont = shipment.containers?.filter(c => c.gateOutWh).length || 0;
                      progressIndicator = (
                        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-ink-muted-80)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: completedCont === totalCont && totalCont > 0 ? 'var(--color-status-success)' : 'var(--color-status-warning)' }}></span>
                          {completedCont}/{totalCont} kontainer Gate Out WH
                        </div>
                      );
                    } else if (colName === 'Financial Settlement') {
                      const shipmentJOs = jobOrders.filter(jo => jo.shipmentUn === shipment.un);
                      const totalHutang = shipmentJOs.reduce((sum, jo) => sum + jo.totalInvoice, 0);
                      const totalDibayar = shipmentJOs.reduce((sum, jo) => sum + (jo.totalInvoice - jo.remainingBalance), 0);
                      progressIndicator = (
                        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-ink-muted-80)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: totalDibayar >= totalHutang && totalHutang > 0 ? 'var(--color-status-success)' : 'var(--color-status-warning)' }}></span>
                          Rp {fmtRupiah(totalDibayar)} / Rp {fmtRupiah(totalHutang)} terbayar
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={shipment.id} 
                        onClick={() => handleCardClick(shipment, colName)}
                        style={{ 
                          padding: '16px', backgroundColor: 'var(--color-canvas)', 
                          border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer',
                          transition: 'transform 0.1s, box-shadow 0.1s',
                          position: 'relative'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: '700', color: STAGE_STYLES[colName].color, marginBottom: '8px' }}>
                          {shipment.un}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '4px' }}>
                          {shipment.supplier}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>
                          B/L: {shipment.blSwbAwb || '—'}
                        </div>
                        
                        {progressIndicator}

                        <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--color-ink-muted-48)', textAlign: 'right' }}>
                          {daysInStage === 0 ? 'Telah berada di stage ini selama < 1 Hari' : `Telah berada di stage ini selama ${daysInStage} Hari`}
                        </div>
                      </div>
                    );
                  })}
                  
                  {items.length === 0 && (
                    <div style={{ 
                      padding: '32px 16px', textAlign: 'center', color: 'var(--color-ink-muted-48)', 
                      fontSize: '13px', border: '1px dashed var(--color-hairline)', 
                      borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--color-canvas-parchment)',
                      opacity: 0.7
                    }}>
                      Belum ada shipment
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Modal Detail */}
      <StatusShipmentModal 
        shipment={selectedShipment} 
        jobOrders={jobOrders}
        stage={selectedStage}
        onClose={() => setSelectedShipment(null)} 
      />

    </div>
  );
};

export default StatusShipmentPage;
