import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { emptyShipmentCosts, emptyContainer } from '../utils/importCalc';
import usePaymentStore from './usePaymentStore';

// ─── Master Data Awal ─────────────────────────────────────────────────────────

const initialMasterData = {
  suppliers: [
    'PT. Hana Steel Indonesia',
    'Showa Packaging Co., Ltd.',
    'Meijer Food Ingredients B.V.',
    'PT. Samudera Cargo',
    'Thyssenkrupp Materials Indonesia',
  ],

  // Kategori barang & mode transport adalah enum tetap (tidak bisa diubah user)
  // Disimpan di sini agar mudah diakses oleh dropdown tanpa import enum tersebar

  depoRoutes: [
    "40' PBN",
    "40' CIKARANG",
    "40' SAMICO",
    "20' PBN",
    "20' CIKARANG",
    "20' SAMICO",
  ],

  whRoutes: [
    'Cikarang',
    'Cikampek',
    'Karawang',
    'Bekasi',
    'Marunda',
  ],



  // truckPrices: [ { updatedAt, param(vendor code), routes: { [routeKey]: number|'N/A' } } ]
  // routeKey = camelCase dari depoRoute (mis. "40' PBN" → "r40PBN")
  truckPrices: [
    {
      id: 'tp-1',
      updatedAt: '2026-07-01',
      param: 'ATS',
      r40PBN: 4500000,
      r40CIKARANG: 5000000,
      r40SAMICO: 4800000,
      r20PBN: 3000000,
      r20CIKARANG: 3500000,
      r20SAMICO: 3200000,
    },
    {
      id: 'tp-2',
      updatedAt: '2026-07-01',
      param: 'SMC',
      r40PBN: 4200000,
      r40CIKARANG: 4800000,
      r40SAMICO: 'N/A',
      r20PBN: 2900000,
      r20CIKARANG: 3300000,
      r20SAMICO: 'N/A',
    },
    {
      id: 'tp-3',
      updatedAt: '2026-07-01',
      param: 'SPL',
      r40PBN: 'N/A',
      r40CIKARANG: 5200000,
      r40SAMICO: 5000000,
      r20PBN: 'N/A',
      r20CIKARANG: 3600000,
      r20SAMICO: 3400000,
    },
  ],

  // depoPrices: [ { id, updatedAt, param(route label), storage, monitoring, recooling, lolo } ]
  depoPrices: [
    { id: 'dp-1', updatedAt: '2026-07-01', param: "40' PBN",      storage: 120000, monitoring: 50000, recooling: 0,      lolo: 250000 },
    { id: 'dp-2', updatedAt: '2026-07-01', param: "40' CIKARANG", storage: 135000, monitoring: 55000, recooling: 0,      lolo: 275000 },
    { id: 'dp-3', updatedAt: '2026-07-01', param: "20' PBN",      storage: 90000,  monitoring: 40000, recooling: 0,      lolo: 200000 },
    { id: 'dp-4', updatedAt: '2026-07-01', param: "20' CIKARANG", storage: 100000, monitoring: 45000, recooling: 250000, lolo: 220000 },
  ],
};

// ─── Dummy Shipments ──────────────────────────────────────────────────────────

const now = new Date();
const isoNow = now.toISOString();

const initialShipments = [];

// ─── ID Generator ─────────────────────────────────────────────────────────────

const generateShipmentId = (shipments) => {
  const nums = shipments.map(s => {
    const m = s.id.match(/SHP-(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const highest = nums.length > 0 ? Math.max(...nums) : 0;
  return `SHP-${String(highest + 1).padStart(4, '0')}`;
};

const generateMasterId = (prefix, list) => {
  const nums = list.map(r => {
    const m = r.id?.match(new RegExp(`${prefix}-(\\d+)`));
    return m ? parseInt(m[1], 10) : 0;
  });
  const highest = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}-${String(highest + 1)}`;
};

// ─── Store ────────────────────────────────────────────────────────────────────

const useImportOperationalStore = create(persist((set, get) => ({
  shipments: initialShipments,
  masterData: initialMasterData,

  // ── Shipment CRUD ──────────────────────────────────────────────────────────

  /**
   * addShipment: Tambah shipment baru dengan identitas awal.
   * Costs dibuat kosong (0), diisi di detail view.
   */
  addShipment: (data) => {
    const shipments = get().shipments;
    const id = generateShipmentId(shipments);
    const ts = new Date().toISOString();
    const shipment = {
      id,
      un: data.un?.trim() || '',
      kat: data.kat || 'RM',
      supplier: data.supplier || '',
      trade: data.trade?.trim() || '',
      shipmentTerm: data.shipmentTerm?.trim() || '',
      inv: data.inv?.trim() || '',
      blSwbAwb: data.blSwbAwb?.trim() || '',
      etd: data.etd || null,
      eta: data.eta || null,
      ata: data.ata || null,
      hsCode: data.hsCode?.trim() || '',
      freeTimeDest: Number(data.freeTimeDest) || 0,
      modeTransport: data.modeTransport || 'FCL',
      qtty: Number(data.qtty) || 0,
      qttyUom: data.qttyUom?.trim() || 'MT',
      depo: data.depo || '',
      gudang: data.gudang || '',
      importProjectId: data.importProjectId || null,
      containers: [{ ...emptyContainer(), cont: data.cont?.trim() || '' }],
      costs: emptyShipmentCosts(),
      createdAt: ts,
      updatedAt: ts,
      createdBy: data.createdBy || 'User',
    };
    set(state => ({ shipments: [shipment, ...state.shipments] }));
    return shipment;
  },

  /**
   * updateShipmentIdentity: Update field identitas + tracking saja.
   */
  updateShipmentIdentity: (id, data) => {
    const ts = new Date().toISOString();
    set(state => ({
      shipments: state.shipments.map(s =>
        s.id !== id ? s : { ...s, ...data, updatedAt: ts }
      ),
    }));
  },

  /**
   * updateShipmentCosts: Simpan seluruh objek costs dari ShipmentDetail.
   * dipanggil saat user klik "Simpan Semua".
   */
  updateShipmentCosts: (id, newCosts) => set(state => {
    const shipment = state.shipments.find(s => s.id === id);
    if (!shipment) return state;

    // Trigger sync ke Payment Store
    usePaymentStore.getState().syncFromImportOps(
      shipment.id, 
      shipment.un, 
      newCosts, 
      shipment.containers, 
      {
        depo: shipment.depo
      }
    );

    return {
      shipments: state.shipments.map(s => s.id === id ? { ...s, costs: newCosts, updatedAt: new Date().toISOString() } : s)
    };
  }),

  /**
   * updateShipmentContainers: Simpan array containers.
   */
  updateShipmentContainers: (id, containers) => {
    const ts = new Date().toISOString();
    set(state => ({
      shipments: state.shipments.map(s =>
        s.id !== id ? s : { ...s, containers, updatedAt: ts }
      ),
    }));
  },

  /**
   * deleteShipment: Hapus shipment secara permanen.
   */
  deleteShipment: (id) => {
    set(state => ({ shipments: state.shipments.filter(s => s.id !== id) }));
  },

  /**
   * getShipmentById: Cari satu shipment berdasarkan ID.
   */
  getShipmentById: (id) => get().shipments.find(s => s.id === id) || null,

  // ── Master Data: Suppliers ─────────────────────────────────────────────────

  addSupplier: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set(state => ({
      masterData: {
        ...state.masterData,
        suppliers: [...state.masterData.suppliers, trimmed],
      },
    }));
  },

  removeSupplier: (index) => {
    set(state => ({
      masterData: {
        ...state.masterData,
        suppliers: state.masterData.suppliers.filter((_, i) => i !== index),
      },
    }));
  },

  // ── Master Data: Depo Routes ───────────────────────────────────────────────

  addDepoRoute: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set(state => ({
      masterData: { ...state.masterData, depoRoutes: [...state.masterData.depoRoutes, trimmed] },
    }));
  },

  removeDepoRoute: (index) => {
    set(state => ({
      masterData: { ...state.masterData, depoRoutes: state.masterData.depoRoutes.filter((_, i) => i !== index) },
    }));
  },

  // ── Master Data: Warehouse Routes ─────────────────────────────────────────

  addWhRoute: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set(state => ({
      masterData: { ...state.masterData, whRoutes: [...state.masterData.whRoutes, trimmed] },
    }));
  },

  removeWhRoute: (index) => {
    set(state => ({
      masterData: { ...state.masterData, whRoutes: state.masterData.whRoutes.filter((_, i) => i !== index) },
    }));
  },



  // ── Master Data: Truck Prices ──────────────────────────────────────────────

  addTruckPriceRow: (row) => {
    const id = generateMasterId('tp', get().masterData.truckPrices);
    const newRow = { id, updatedAt: new Date().toISOString().split('T')[0], ...row };
    set(state => ({
      masterData: { ...state.masterData, truckPrices: [...state.masterData.truckPrices, newRow] },
    }));
  },

  updateTruckPriceRow: (id, field, value) => {
    set(state => ({
      masterData: {
        ...state.masterData,
        truckPrices: state.masterData.truckPrices.map(r =>
          r.id !== id ? r : { ...r, [field]: value, updatedAt: new Date().toISOString().split('T')[0] }
        ),
      },
    }));
  },

  removeTruckPriceRow: (id) => {
    set(state => ({
      masterData: { ...state.masterData, truckPrices: state.masterData.truckPrices.filter(r => r.id !== id) },
    }));
  },

  // ── Master Data: Depo Prices ───────────────────────────────────────────────

  addDepoPriceRow: (row) => {
    const id = generateMasterId('dp', get().masterData.depoPrices);
    const newRow = { id, updatedAt: new Date().toISOString().split('T')[0], ...row };
    set(state => ({
      masterData: { ...state.masterData, depoPrices: [...state.masterData.depoPrices, newRow] },
    }));
  },

  updateDepoPriceRow: (id, field, value) => {
    set(state => ({
      masterData: {
        ...state.masterData,
        depoPrices: state.masterData.depoPrices.map(r =>
          r.id !== id ? r : { ...r, [field]: value, updatedAt: new Date().toISOString().split('T')[0] }
        ),
      },
    }));
  },

  removeDepoPriceRow: (id) => {
    set(state => ({
      masterData: { ...state.masterData, depoPrices: state.masterData.depoPrices.filter(r => r.id !== id) },
    }));
  },
})), { name: 'importops-storage' }));

export default useImportOperationalStore;
