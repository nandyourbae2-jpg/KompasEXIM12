import { create } from 'zustand';
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

const initialShipments = [
  {
    id: 'SHP-0001',
    un: 'IMP-0001',
    kat: 'RM',
    supplier: 'PT. Hana Steel Indonesia',
    trade: 'Korea Selatan',
    shipmentTerm: 'CIF',
    inv: 'INV-HSI-2026-0089',
    blSwbAwb: 'BL-20260705-001',
    etd: '2026-07-05',
    eta: '2026-07-25',
    ata: '2026-07-26',
    hsCode: '7209.17.00',
    freeTimeDest: 10,
    modeTransport: 'FCL',
    qtty: 24.5,
    qttyUom: 'MT',
    depo: "40' PBN",
    gudang: 'Cikarang',
    importProjectId: 'IMP-0001',
    containers: [
      {
        ...emptyContainer(),
        cont: 'TCKU1234567',
        stack: '2026-07-20T08:00:00.000Z',
        gateOut: '2026-07-21T14:30:00.000Z',
        truRepoVendor: 'ATS',
        truRepoArrival: '2026-07-21T15:00:00.000Z',
        truRepoDepart: '2026-07-21T16:30:00.000Z',
        truWhVendor: 'ATS',
        truWhGateInWh: '2026-07-22T09:00:00.000Z',
        offlStart: '2026-07-22T09:30:00.000Z',
        offlEnd: '2026-07-22T15:45:00.000Z',
        gateOutWh: '2026-07-22T16:00:00.000Z',
        lamaInapSasis: 2.5,
        waktuAntri: 0.5,
        durasioBongkar: 6.25,
        fishIssue: false,
        queueIssue: false,
        spaceIssue: false,
        otherIssue: false,
      }
    ],
    costs: {
      ...emptyShipmentCosts(),
      trucRepo: { noInvRepo: 'INV-ATS-001', dpp: 4500000, pctPpn: 11, ppn: 495000, noFp: 'FP-001' },
      trucWh:   { noInvTruk: 'INV-ATS-002', biayaDasar: 4500000, inapSasis: 300000, other: 0, otherNotes: '', dpp: 4800000, pctPpn: 11, ppn: 528000, noFp: 'FP-002' },
      depo:     { calcDay: 12, calcShift: 0, actDay: 12, actShift: 0, noInvDepo: 'INV-PBN-001', storage: 1440000, monitoring: 600000, recooling: 0, lolo: 3000000, dpp: 5040000, pctPpn: 11, ppn: 554400, noFp: 'FP-003' },
      loloPort: { invNo: 'INV-PORT-001', dpp: 1200000, ppn: 132000, fp: 'FP-004', gpNo: 'GP-001' },
    },
    createdAt: isoNow,
    updatedAt: isoNow,
    createdBy: 'Ahmad F.',
  },
  {
    id: 'SHP-0002',
    un: 'IMP-0002',
    kat: 'Ind. Pckg',
    supplier: 'Showa Packaging Co., Ltd.',
    trade: 'Jepang',
    shipmentTerm: 'FOB',
    inv: 'INV-SPC-2026-0042',
    blSwbAwb: 'BL-20260708-002',
    etd: '2026-07-08',
    eta: '2026-07-28',
    ata: null,
    hsCode: '3923.21.00',
    freeTimeDest: 7,
    modeTransport: 'LCL Sea',
    qtty: 8.2,
    qttyUom: 'MT',
    depo: "40' CIKARANG",
    gudang: 'Cikampek',
    importProjectId: 'IMP-0002',
    containers: [
      {
        ...emptyContainer(),
        cont: 'MAEU9876543',
        durasioBongkar: 28.0,
        queueIssue: true,
      }
    ],
    costs: emptyShipmentCosts(),
    createdAt: isoNow,
    updatedAt: isoNow,
    createdBy: 'Ahmad F.',
  },
  {
    id: 'SHP-0003',
    un: 'IMP-0003',
    kat: 'Ind. Food',
    supplier: 'Meijer Food Ingredients B.V.',
    trade: 'Belanda',
    shipmentTerm: 'CFR',
    inv: 'INV-MFI-2026-0115',
    blSwbAwb: 'BL-20260710-003',
    etd: '2026-07-10',
    eta: '2026-08-05',
    ata: null,
    hsCode: '2106.90.69',
    freeTimeDest: 14,
    modeTransport: 'FCL',
    qtty: 16.0,
    qttyUom: 'MT',
    depo: "20' PBN",
    gudang: 'Karawang',
    importProjectId: 'IMP-0003',
    containers: [
      {
        ...emptyContainer(),
        cont: 'HLBU3456789',
        durasioBongkar: 75.5,
        fishIssue: true,
        spaceIssue: true,
      }
    ],
    costs: emptyShipmentCosts(),
    createdAt: isoNow,
    updatedAt: isoNow,
    createdBy: 'Ahmad F.',
  },
];

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

const useImportOperationalStore = create((set, get) => ({
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
}));

export default useImportOperationalStore;
