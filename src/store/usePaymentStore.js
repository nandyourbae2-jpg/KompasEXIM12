import { create } from 'zustand';
import api from '../lib/api';

const usePaymentStore = create((set, get) => ({
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
      // Backend api('/job-orders') returns an array directly
      const jobOrdersArray = Array.isArray(data) ? data : (data.jobOrders || []);
      const jobOrders = jobOrdersArray.map(normJobOrder);
      set({ jobOrders, isLoading: false });
    } catch (err) {
      console.error('[fetchJobOrders] error:', err);
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

  addInvoice: async (invoiceData, file, currentUser) => {
    try {
      const payload = {
        job_order_code: invoiceData.id || `INV-${Date.now()}`,
        vendor_id: invoiceData.vendor_id || 1, // Require real vendor ID in production
        cost_type: invoiceData.costType || 'Other',
        dpp: parseFloat(invoiceData.dpp || 0),
        persen_ppn: parseFloat(invoiceData.persen_ppn || 11),
        tanggal_invoice: new Date().toISOString().split('T')[0],
        tanggal_jatuh_tempo: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
      };
      
      const newJo = await api('/job-orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await get().fetchJobOrders();
      return normJobOrder(newJo);
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  },

  deleteJobOrder: async (jobOrderId) => {
    try {
      const dbId = get().jobOrders.find(jo => jo.id === jobOrderId)?.dbId;
      if (!dbId) throw new Error('Job Order not found in state');
      
      await api(`/job-orders/${dbId}`, { method: 'DELETE' });
      await get().fetchJobOrders();
    } catch (error) {
      console.error('Error deleting job order:', error);
      throw error;
    }
  },

  updatePayment: async (jobOrderId, paymentAmount, currentUser, customDate, paymentMethod) => {
    try {
      const jo = get().jobOrders.find(jo => jo.id === jobOrderId);
      if (!jo) throw new Error('Job Order not found in state');
      const dbId = jo.dbId;
      const version = jo.version;

      const payload = {
        jumlah_bayar: parseFloat(paymentAmount),
        tanggal_bayar: customDate || new Date().toISOString().split('T')[0],
        metode: paymentMethod || 'Termin Payment',
        dicatat_oleh_id: currentUser?.id || 1,
        version: version
      };

      await api(`/job-orders/${dbId}/payments`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await get().fetchJobOrders();
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  },

  /**
   * archiveJobOrders: Hapus JO Lunas dari state lokal setelah close-quarter.
   * Data sudah dihapus dari DB oleh backend.
   */
  archiveJobOrders: (joIdsToRemove) => set(state => ({
    jobOrders: state.jobOrders.filter(jo => !joIdsToRemove.includes(jo.id))
  })),


}));

/**
 * normJobOrder: Normalisasi shape job order dari backend ke format yang dipakai UI.
 */
const normJobOrder = (jo) => {
  const dpp = parseFloat(jo.dpp || 0);
  const persenPpn = parseFloat(jo.persen_ppn || 0);
  const tax = parseFloat(jo.ppn ?? ((dpp * persenPpn) / 100)); // Fallback if jo.ppn is missing initially
  
  return {
    id: `JO-${String(jo.id).padStart(4, '0')}`,
    invoiceNo: jo.invoice_no || jo.job_order_code,
    jobOrderCode: jo.job_order_code,
    dbId: jo.id,
    vendorName: jo.vendor?.nama || jo.vendor_name || jo.ledger_vendor_nama || jo.vendor_id || 'Unknown',
    costType: jo.cost_type,
    currency: jo.mata_uang,
    dpp: dpp,
    persenPpn: persenPpn,
    tax: tax,
    sumber: jo.sumber,
    shipmentId: jo.import_shipment_id,
    shipmentUn: jo.shipment?.un || jo.invoice_no || jo.job_order_code,
    totalInvoice: parseFloat(jo.total_invoice),
    totalPaid: parseFloat(jo.total_paid),
    remainingBalance: parseFloat(jo.remaining_balance ?? (jo.total_invoice - jo.total_paid)),
    status: jo.status,
    dueDate: jo.tanggal_jatuh_tempo,
    tanggal_invoice: jo.tanggal_invoice,
    created_at: jo.created_at,
    version: jo.version || 1,
    financial_request_number: jo.financial_request_number,
  payments: (jo.payment_logs || []).map(p => ({
    id: `PAY-${p.id}`,
    amount: parseFloat(p.jumlah_bayar),
    date: new Date(p.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    method: p.metode,
    byId: p.dibuat_oleh?.id || p.byId || null,
  })),
};
};

export default usePaymentStore;
