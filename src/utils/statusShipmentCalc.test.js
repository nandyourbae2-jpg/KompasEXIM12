import { describe, it, expect } from 'vitest';
import { hitungStage } from './statusShipmentCalc';

describe('statusShipmentCalc utility', () => {
  const baseShipment = {
    un: 'BL-123',
    containers: [],
    ata: '',
    costs: {}
  };

  it('should return "Shipment Active" if ata is empty and no containers are gateOutWh', () => {
    expect(hitungStage(baseShipment, [])).toBe('Shipment Active');
  });

  it('should return "Delivery Active" if ata is set but containers are not all gateOutWh', () => {
    const shipment = {
      ...baseShipment,
      ata: '2023-10-01',
      containers: [{ gateOutWh: '' }]
    };
    expect(hitungStage(shipment, [])).toBe('Delivery Active');
  });

  it('should return "Financial Settlement" if all containers are gateOutWh but JOs not paid', () => {
    const shipment = {
      ...baseShipment,
      containers: [{ gateOutWh: '2023-10-02' }]
    };
    const jobOrders = [{ shipmentUn: 'BL-123', remainingBalance: 1000 }];
    
    expect(hitungStage(shipment, jobOrders)).toBe('Financial Settlement');
  });

  it('should return "Financial Settlement" if containers gateOutWh, JOs paid, but claim is pending', () => {
    const shipment = {
      ...baseShipment,
      containers: [{ gateOutWh: '2023-10-02' }],
      costs: {
        claimSupplier: { amount: 500, status_klaim: 'Pending' }
      }
    };
    const jobOrders = [{ shipmentUn: 'BL-123', remainingBalance: 0 }];
    
    expect(hitungStage(shipment, jobOrders)).toBe('Financial Settlement');
  });

  it('should return "Status Complete" if containers gateOutWh, JOs paid, and all claims accepted', () => {
    const shipment = {
      ...baseShipment,
      containers: [{ gateOutWh: '2023-10-02' }],
      costs: {
        claimSupplier: { amount: 500, status_klaim: 'Diterima' }
      }
    };
    const jobOrders = [{ shipmentUn: 'BL-123', remainingBalance: 0 }];
    
    expect(hitungStage(shipment, jobOrders)).toBe('Status Complete');
  });

  it('should return "Status Complete" if containers gateOutWh, JOs paid, and claims have 0 amount', () => {
    const shipment = {
      ...baseShipment,
      containers: [{ gateOutWh: '2023-10-02' }],
      costs: {
        claimSupplier: { amount: 0, status_klaim: 'Pending' }
      }
    };
    const jobOrders = [{ shipmentUn: 'BL-123', remainingBalance: 0 }];
    
    expect(hitungStage(shipment, jobOrders)).toBe('Status Complete');
  });
});
