import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

const usePaymentStore = create(persist((set, get) => ({
  jobOrders: [],
  isLoading: false,
  error: null,

  /**
   * fetchJobOrders: Ambil semua job order dari backend.
   * Backend sudah compute remaining_balance dan status on-the-fly.
   */
  fetchJobOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api('/job-orders');
      const jobOrders = data.jobOrders.map(normJobOrder);
      set({ jobOrders, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /**
   * getKpiStats: Hitung KPI dari data yang sudah di-fetch.
   * Data sudah ada di state, tidak perlu API call tambahan.
   */
  getKpiStats: () => {
    const orders = get().jobOrders;
    let totalInvoiceIDR = 0, totalPaidIDR = 0, remainingBalanceIDR = 0;
    let totalInvoiceUSD = 0, totalPaidUSD = 0, remainingBalanceUSD = 0;

    orders.forEach(jo => {
      if (jo.currency === 'USD') {
        totalInvoiceUSD += jo.totalInvoice;
        totalPaidUSD += jo.totalPaid;
        remainingBalanceUSD += jo.remainingBalance;
      } else {
        totalInvoiceIDR += jo.totalInvoice;
        totalPaidIDR += jo.totalPaid;
        remainingBalanceIDR += jo.remainingBalance;
      }
    });

    return {
      IDR: { totalInvoice: totalInvoiceIDR, totalPaid: totalPaidIDR, remainingBalance: remainingBalanceIDR },
      USD: { totalInvoice: totalInvoiceUSD, totalPaid: totalPaidUSD, remainingBalance: remainingBalanceUSD },
    };
  },

  /**
   * addInvoice: Tambah tagihan baru via POST /api/job-orders
   */
  addInvoice: async (invoiceData, file, currentUser) => {
    // Bypassing API for frontend prototype
    const jo = {
      id: `INV-MOCK-${Date.now()}`,
      dbId: `MOCK-${Date.now()}`,
      vendorName: invoiceData.vendorNamaBaru || invoiceData.vendor_id || 'Unknown',
      costType: invoiceData.costType || 'Other',
      currency: invoiceData.currency || 'IDR',
      totalInvoice: parseFloat(invoiceData.totalInvoice || 0),
      totalPaid: 0,
      remainingBalance: parseFloat(invoiceData.totalInvoice || 0),
      status: 'Belum Dibayar',
      dueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
      payments: [],
      sumber: 'manual',
    };
    
    set(state => ({ jobOrders: [jo, ...state.jobOrders] }));
    return jo;
  },

  /**
   * updatePayment: Catat pembayaran via POST /api/job-orders/:id/payments
   */
  updatePayment: async (jobOrderId, paymentAmount, file, currentUser, customDate, paymentMethod) => {
    // Bypassing API for frontend prototype
    set(state => {
      const jobOrders = state.jobOrders.map(jo => {
        if (jo.id === jobOrderId) {
          const amt = parseFloat(paymentAmount) || 0;
          const newPayment = {
            id: `PAY-MOCK-${Date.now()}`,
            amount: amt,
            date: customDate ? new Date(customDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
            method: paymentMethod || 'Bank Transfer',
            byId: currentUser?.id || null,
          };
          
          const newTotalPaid = (jo.totalPaid || 0) + amt;
          const newRemaining = jo.totalInvoice - newTotalPaid;
          let newStatus = jo.status;
          
          if (newTotalPaid >= jo.totalInvoice && jo.totalInvoice > 0) {
             newStatus = 'Lunas';
          } else if (newTotalPaid > 0) {
             newStatus = 'Bayar Sebagian';
          }
          
          return {
            ...jo,
            totalPaid: newTotalPaid,
            remainingBalance: newRemaining,
            status: newStatus,
            payments: [...(jo.payments || []), newPayment],
          };
        }
        return jo;
      });
      return { jobOrders };
    });
  },

  /**
   * archiveJobOrders: Hapus JO Lunas dari state lokal setelah close-quarter.
   * Data sudah dihapus dari DB oleh backend.
   */
  archiveJobOrders: (joIdsToRemove) => set(state => ({
    jobOrders: state.jobOrders.filter(jo => !joIdsToRemove.includes(jo.id))
  })),

  /**
   * syncFromImportOps: Ekstrak semua kategori biaya yang memiliki Invoice No
   * lalu upsert ke dalam jobOrders (hanya di local state untuk UI prototipe ini).
   */
  syncFromImportOps: (shipmentId, shipmentUn, costs, tracking, identity) => {
    set(state => {
      let currentJOs = [...state.jobOrders];

      // Definisikan mapping dari 24 kategori biaya
      // Format: { key, name, invField, dppField, ppnField, totalField (jika ada, else dpp+ppn), vendor }
      // Kita akan proses satu per satu.
      
      const cats = [
        { key: 'trucRepo', name: 'TRUC (Repo Depo)', inv: costs.trucRepo.noInvRepo, total: (Number(costs.trucRepo.dpp) || 0) + ((Number(costs.trucRepo.dpp) || 0) * (Number(costs.trucRepo.pctPpn) || 0) / 100), vendor: tracking.truRepoVendor || 'Unknown' },
        { key: 'trucWh', name: 'TRUC (Warehouse)', inv: costs.trucWh.noInvTruk, total: ((Number(costs.trucWh.biayaDasar) || 0) + (Number(costs.trucWh.inapSasis) || 0) + (Number(costs.trucWh.other) || 0)) * (1 + (Number(costs.trucWh.pctPpn) || 0) / 100), vendor: tracking.truWhVendor || 'Unknown' },
        { key: 'loloReimbLiftoff', name: 'LOLO (Reimb. Liftoff)', inv: costs.loloReimb.noInvLiftoff, total: (Number(costs.loloReimb.dppLiftoff) || 0) + (Number(costs.loloReimb.ppnLiftoff) || 0), vendor: 'Pelabuhan' },
        { key: 'loloReimbRepair', name: 'LOLO (Reimb. Repair)', inv: costs.loloReimb.noInvRepair, total: (Number(costs.loloReimb.dppRepair) || 0) + (Number(costs.loloReimb.ppnRepair) || 0), vendor: 'Pelabuhan' },
        { key: 'depo', name: 'DEPO', inv: costs.depo.noInvDepo, total: ((Number(costs.depo.storage)||0) + (Number(costs.depo.monitoring)||0) + (Number(costs.depo.recooling)||0) + (Number(costs.depo.lolo)||0)) * (1 + (Number(costs.depo.pctPpn)||0)/100), vendor: identity.depo || 'Unknown Depo' },
        { key: 'othePerizinan', name: 'OTHE (Perizinan)', inv: costs.othePerizinan.invNo, total: (Number(costs.othePerizinan.amount) || 0) + (Number(costs.othePerizinan.vat) || 0), vendor: costs.othePerizinan.vendorName || 'Unknown' },
        { key: 'lineFreight', name: 'LINE (Freight & Local Charges Origin)', inv: costs.lineFreight.invNo, total: (Number(costs.lineFreight.dpp) || 0) * (1 + (Number(costs.lineFreight.pctPpn) || 0) / 100), vendor: costs.lineFreight.vendorName || 'Unknown' },
        { key: 'lineLocalIdn', name: 'LINE (Local Charges Indonesia)', inv: costs.lineLocalIdn.invNo, total: (Number(costs.lineLocalIdn.dpp) || 0) * (1 + (Number(costs.lineLocalIdn.pctPpn) || 0) / 100), vendor: costs.lineLocalIdn.vendorName || 'Unknown' },
        { key: 'lineExtendDO', name: 'LINE (Extend DO / Demdet)', inv: costs.lineExtendDO.invNo, total: (Number(costs.lineExtendDO.dpp) || 0) * (1 + (Number(costs.lineExtendDO.pctPpn) || 0) / 100), vendor: costs.lineExtendDO.vendorName || 'Unknown' },
        { key: 'otheCustomsBond', name: 'OTHE (Customs Bond)', inv: costs.otheCustomsBond.noInvCb, total: (Number(costs.otheCustomsBond.dpp) || 0) - (Number(costs.otheCustomsBond.diskon) || 0), vendor: costs.otheCustomsBond.vendorName || 'Unknown' },
        { key: 'loloPort', name: 'LOLO (Port)', inv: costs.loloPort.invNo, total: (Number(costs.loloPort.dpp) || 0) + (Number(costs.loloPort.ppn) || 0), vendor: costs.loloPort.vendorName || 'Unknown' },
        { key: 'loloHicoBahandel', name: 'LOLO (Hico/Bahandel)', inv: costs.loloHicoBahandel.invNo, total: (Number(costs.loloHicoBahandel.dpp) || 0) + (Number(costs.loloHicoBahandel.ppn) || 0), vendor: costs.loloHicoBahandel.vendorName || 'Unknown' },
        { key: 'loloGudangPort', name: 'LOLO (Gudang Port)', inv: costs.loloGudangPort.invNo, total: (Number(costs.loloGudangPort.dpp) || 0) + (Number(costs.loloGudangPort.ppn) || 0), vendor: costs.loloGudangPort.vendorName || 'Unknown' },
        { key: 'otheOtherCost', name: 'OTHE (Other Cost)', inv: costs.otheOtherCost.invoice, total: (Number(costs.otheOtherCost.dpp) || 0) + (Number(costs.otheOtherCost.ppn) || 0), vendor: costs.otheOtherCost.vendorName || 'Unknown' },
      ];

      // Kumpulkan JO apa saja yang sebelumnya dibuat oleh shipment ini
      const previousSyncs = currentJOs.filter(j => j.shipmentId === shipmentId && j.sumber === 'import_operational');
      const activeKeys = new Set();

      cats.forEach(cat => {
        if (cat.inv && cat.inv.trim() !== '' && cat.total > 0) {
          activeKeys.add(cat.key);
          const existingIdx = currentJOs.findIndex(j => j.shipmentId === shipmentId && j.importCategoryKey === cat.key);
          
          if (existingIdx >= 0) {
            // Update existing
            const ex = currentJOs[existingIdx];
            const newTotal = cat.total;
            const remaining = newTotal - ex.totalPaid;
            let status = ex.status;
            if (ex.totalPaid >= newTotal && newTotal > 0) status = 'Lunas';
            else if (ex.totalPaid > 0) status = 'Bayar Sebagian';
            else status = 'Belum Dibayar';

            currentJOs[existingIdx] = {
              ...ex,
              id: cat.inv,
              vendorName: cat.vendor,
              totalInvoice: newTotal,
              remainingBalance: remaining,
              status
            };
          } else {
            // Insert new
            const newJo = {
              id: cat.inv,
              dbId: `SYNC-${Date.now()}-${cat.key}`,
              vendorName: cat.vendor,
              costType: cat.name,
              currency: 'IDR',
              totalInvoice: cat.total,
              totalPaid: 0,
              remainingBalance: cat.total,
              status: 'Belum Dibayar',
              dueDate: new Date().toISOString().split('T')[0],
              payments: [],
              sumber: 'import_operational',
              shipmentId,
              shipmentUn,
              importCategoryKey: cat.key
            };
            currentJOs.unshift(newJo);
          }
        }
      });

      // Handle orphans (Invoice dihapus di Import Ops)
      previousSyncs.forEach(prevJo => {
        if (!activeKeys.has(prevJo.importCategoryKey)) {
          if (prevJo.totalPaid === 0) {
            // Hapus jika belum dibayar
            currentJOs = currentJOs.filter(j => j.dbId !== prevJo.dbId);
          } else {
            // Mark as terputus jika sudah ada payment
            const idx = currentJOs.findIndex(j => j.dbId === prevJo.dbId);
            if (idx >= 0) {
              currentJOs[idx] = { ...currentJOs[idx], sumber: 'terputus' };
            }
          }
        }
      });

      return { jobOrders: currentJOs };
    });
  },
})), { name: 'payment-storage' }));

/**
 * normJobOrder: Normalisasi shape job order dari backend ke format yang dipakai UI.
 */
const normJobOrder = (jo) => ({
  id: jo.job_order_code,
  dbId: jo.id,
  vendorName: jo.vendor?.nama || jo.vendor_id || 'Unknown',
  costType: jo.cost_type,
  currency: jo.mata_uang,
  totalInvoice: parseFloat(jo.total_invoice),
  totalPaid: parseFloat(jo.total_paid),
  remainingBalance: parseFloat(jo.remaining_balance ?? (jo.total_invoice - jo.total_paid)),
  status: jo.status,
  dueDate: jo.tanggal_jatuh_tempo,
  payments: (jo.payment_logs || []).map(p => ({
    id: `PAY-${p.id}`,
    amount: parseFloat(p.jumlah_bayar),
    date: new Date(p.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    method: p.metode,
    byId: p.dibuat_oleh?.id || p.byId || null,
  })),
});

export default usePaymentStore;
