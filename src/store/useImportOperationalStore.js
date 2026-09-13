import { create } from 'zustand';
import { emptyShipmentCosts, emptyContainer, mergeShipmentCosts } from '../utils/importCalc';
import usePaymentStore from './usePaymentStore';
import { api } from '../lib/api';

const calcHours = (endIso, startIso) => {
  if (!endIso || !startIso) return null;
  const end = new Date(endIso).getTime();
  const start = new Date(startIso).getTime();
  if (isNaN(end) || isNaN(start)) return null;
  const diffHours = (end - start) / (1000 * 60 * 60);
  return Math.round(diffHours * 10) / 10;
};

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

  truckRouteKeys: [
    { key: 'r40PBN',      label: "40' PBN" },
    { key: 'r40CIKARANG', label: "40' CIKARANG" },
    { key: 'r40SAMICO',   label: "40' SAMICO" },
    { key: 'r20PBN',      label: "20' PBN" },
    { key: 'r20CIKARANG', label: "20' CIKARANG" },
    { key: 'r20SAMICO',   label: "20' SAMICO" },
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

// ─── Shipment Row Formatter ───────────────────────────────────────────────────

const formatShipment = (s) => ({
  id: s.id,
  un: s.un,
  kat: s.kat,
  supplier: s.supplier,
  trade: s.trade,
  shipmentTerm: s.shipment_term,
  inv: s.invoice_no,
  blSwbAwb: s.bl_no,
  etd: s.etd,
  eta: s.eta,
  atd: s.atd,
  ata: s.ata,
  hsCode: s.hs_code,
  freeTimeDest: s.free_time_destination,
  modeTransport: s.mode_transport,
  qtty: s.qtty,
  qttyUom: s.uom,
  depo: s.depo_route,
  gudang: s.gudang,
  importProjectId: s.import_project_id,
  costs: mergeShipmentCosts(s.costs),
  createdAt: s.created_at,
  updatedAt: s.updated_at,
  createdBy: s.created_by_id,
  generatedRequestIds: s.generated_request_ids ? JSON.parse(s.generated_request_ids) : {},
  container_costs: s.container_costs || [],
  containers: (s.containers || []).map(c => ({
    id: c.id,
    cont: c.no_kontainer,
    stack: c.stack,
    gateOut: c.gate_out,
    depo_route: c.depo_route,
    gudang: c.gudang,
    truckingRepoVendor: c.trucking_repo_vendor,
    truRepoArrival: c.tru_repo_arrival,
    truRepoDepart: c.tru_repo_depart,
    truckingWhVendor: c.trucking_wh_vendor,
    gateInWh: c.gate_in_wh,
    offloadingStart: c.offloading_start,
    offloadingEnd: c.offloading_end,
    gateOutWh: c.gate_out_wh,
    fishIssue: c.fish_issue === 1,
    queueIssue: c.queue_issue === 1,
    spaceIssue: c.space_issue === 1,
    otherIssue: c.other_issue === 1,
    lamaInapSasis: calcHours(c.gate_out_wh, c.gate_in_wh),
    waktuAntri: calcHours(c.offloading_start, c.gate_in_wh),
    durasiBongkar: calcHours(c.offloading_end, c.offloading_start),
  }))
});

// ─── Store ────────────────────────────────────────────────────────────────────

const useImportOperationalStore = create((set, get) => ({
  shipments: initialShipments,
  shipmentPagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  masterData: initialMasterData,
  departemenList: [],

  fetchDepartemen: async () => {
    try {
      const data = await api('/departemen');
      if (Array.isArray(data)) {
        set({ departemenList: data });
      }
      return data;
    } catch (error) {
      console.error('Error fetching departemen:', error);
      return [];
    }
  },

  addDepartemen: async (name) => {
    try {
      const res = await api('/departemen', {
        method: 'POST',
        body: JSON.stringify({ nama_departemen: name.trim() })
      });
      await get().fetchDepartemen();
      return { success: true, data: res };
    } catch (error) {
      console.error('Error adding departemen:', error);
      throw error;
    }
  },

  removeDepartemen: async (id) => {
    try {
      const res = await api(`/departemen/${id}`, { method: 'DELETE' });
      await get().fetchDepartemen();
      return { success: true, data: res };
    } catch (error) {
      console.error('Error removing departemen:', error);
      throw error;
    }
  },

  // ── Shipment CRUD ──────────────────────────────────────────────────────────

  fetchShipments: async (page, limit) => {
    try {
      const currentPage = page ?? get().shipmentPagination.page;
      const currentLimit = limit ?? get().shipmentPagination.limit;
      const res = await api(`/import-shipments?page=${currentPage}&limit=${currentLimit}`);
      // Paginated response: { data: [...], pagination: {...} }
      const rows = res.data ?? res; // fallback in case backend ever returns plain array
      const pagination = res.pagination ?? get().shipmentPagination;
      const formatted = rows.map(formatShipment);
      set({ shipments: formatted, shipmentPagination: pagination });
    } catch (error) {
      console.error('Error fetching import shipments:', error);
    }
  },

  fetchShipmentsPage: async (page) => {
    await get().fetchShipments(page, get().shipmentPagination.limit);
  },

  addShipment: async (data) => {
    try {
      const payload = {
        shipment_code: data.shipmentCode || `SHP-${Date.now()}`,
        import_project_id: data.importProjectId || null,
        supplier: data.supplier || '',
        un: data.un || null,
        kat: data.kat || null,
        invoice_no: data.inv || null,
        bl_no: data.blSwbAwb || null,
        mode_transport: data.modeTransport || null,
        qtty: data.qtty || 0,
        uom: data.qttyUom || 'CBM',
        depo_route: data.depo || null,
        gudang: data.gudang || null,
        atd: data.atd || null,
        ata: data.ata || null,
        etd: data.etd || null,
        eta: data.eta || null,
        hs_code: data.hsCode || null,
        shipment_term: data.shipmentTerm || null,
        trade: data.trade || null,
        free_time_destination: data.freeTimeDest || 0
      };
      
      const headers = {};
      if (data.idempotencyKey) {
        headers['Idempotency-Key'] = data.idempotencyKey;
      }
      const newShipment = await api('/import-shipments', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      // Add initial container if provided BEFORE fetching authoritative state
      if (data.cont && data.cont.trim() !== '') {
        await get().updateShipmentContainers(newShipment.id, [{ cont: data.cont.trim() }]);
      }
      
      // Fetch authoritative state after all mutations are done
      await get().fetchShipments();
      
      return newShipment;
    } catch (error) {
      console.error('Error adding shipment:', error);
      throw error;
    }
  },

  updateShipmentIdentity: async (id, data) => {
    try {
      const payload = {
        un: data.un,
        kat: data.kat,
        supplier: data.supplier,
        invoice_no: data.inv,
        bl_no: data.blSwbAwb,
        mode_transport: data.modeTransport,
        qtty: data.qtty,
        uom: data.qttyUom,
        depo_route: data.depo,
        gudang: data.gudang,
        atd: data.atd,
        ata: data.ata,
        etd: data.etd,
        eta: data.eta,
        hs_code: data.hsCode,
        shipment_term: data.shipmentTerm,
        trade: data.trade,
        free_time_destination: data.freeTimeDest,
      };
      await api(`/import-shipments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      await get().fetchShipments();
    } catch (error) {
      console.error('Error updating shipment identity:', error);
      throw error;
    }
  },

  updateShipmentCosts: async (id, newCosts) => {
    console.log('[ImportOpsStore] updateShipmentCosts called for id:', id);
    try {
      await api(`/import-shipments/${id}/costs`, {
        method: 'PATCH',
        body: JSON.stringify({ costs: newCosts })
      });
      console.log('[ImportOpsStore] PATCH /costs successful');
      
      await get().fetchShipments();
      const shipment = get().shipments.find(s => String(s.id) === String(id));
      console.log('[ImportOpsStore] Found shipment:', !!shipment);
    } catch (error) {
      console.error('Error updating shipment costs:', error);
      throw error;
    }
  },

  updateShipmentContainers: async (id, containers) => {
    // In our backend API, containers are managed per container (PATCH /api/containers/:id, POST /api/import-shipments/:id/containers)
    // For simplicity, we can reload all shipments after making API calls for each container change.
    // However, the prompt specifies:
    // PATCH /api/containers/:id -> update tracking kontainer
    // POST /api/import-shipments/:id/containers -> tambah kontainer
    
    // We expect the frontend to call those endpoints directly or we implement them here.
    // Let's implement them here as separate methods, but keep this for backward compatibility if it passes the whole array.
    try {
      const currentShipment = get().shipments.find(s => String(s.id) === String(id));
      if (!currentShipment) {
        console.warn('[updateShipmentContainers] Shipment not found in local store yet. Proceeding with empty old container list.');
      }

      // Simplistic sync: if a container has no ID, POST it. If it has ID, PATCH it.
      const idMapping = {};
      for (const c of containers) {
        let containerId = c.id;
        if (!containerId || String(containerId).startsWith('temp-')) {
          const res = await api(`/import-shipments/${id}/containers`, {
            method: 'POST',
            body: JSON.stringify({ no_kontainer: c.cont || '' })
          });
          if (containerId) idMapping[containerId] = res.id;
          containerId = res.id;
        }
        
        const payload = {
          no_kontainer: c.cont || '',
          stack: c.stack,
          gate_out: c.gateOut,
          depo_route: c.depo_route,
          gudang: c.gudang,
          trucking_repo_vendor: c.truckingRepoVendor,
          tru_repo_arrival: c.truRepoArrival,
          tru_repo_depart: c.truRepoDepart,
          trucking_wh_vendor: c.truckingWhVendor,
          gate_in_wh: c.gateInWh,
          offloading_start: c.offloadingStart,
          offloading_end: c.offloadingEnd,
          gate_out_wh: c.gateOutWh,
          fish_issue: c.fishIssue ? 1 : 0,
          queue_issue: c.queueIssue ? 1 : 0,
          space_issue: c.spaceIssue ? 1 : 0,
          other_issue: c.otherIssue ? 1 : 0,
        };
        await api(`/containers/${containerId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      }
      
      // Handle deletions
      const newIds = containers.filter(c => c.id).map(c => c.id);
      const oldIds = currentShipment ? currentShipment.containers.map(c => c.id) : [];
      const toDelete = oldIds.filter(oldId => !newIds.includes(oldId));
      for (const delId of toDelete) {
        await api(`/containers/${delId}`, { method: 'DELETE' });
      }

      await get().fetchShipments();
      return idMapping;
    } catch (error) {
      console.error('Error syncing containers:', error);
      throw error;
    }
  },

  deleteShipment: async (id) => {
    try {
      await api(`/import-shipments/${id}`, { method: 'DELETE' });
      await get().fetchShipments();
    } catch (error) {
      console.error('Error deleting shipment:', error);
      throw error;
    }
  },

  getShipmentById: (id) => get().shipments.find(s => String(s.id) === String(id)) || null,

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

  addTruckRouteKey: (label) => {
    const key = 'r' + Date.now();
    set(state => {
      // Tambahkan rute baru ke semua vendor (truckPrices) dengan nilai default 'N/A'
      const updatedTruckPrices = state.masterData.truckPrices.map(row => ({
        ...row,
        [key]: 'N/A'
      }));
      return {
        masterData: {
          ...state.masterData,
          truckRouteKeys: [...state.masterData.truckRouteKeys, { key, label }],
          truckPrices: updatedTruckPrices
        },
      };
    });
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
  }
}));

export default useImportOperationalStore;
