import { create } from 'zustand';

// Dummy list lama dari truckingList
// { code: 'ATS', name: 'Adhirajasa Trucking Sejahtera' },
// { code: 'SMC', name: 'Samudera Cargo' },
// { code: 'SPL', name: 'SPIL Trucking' },

const now = new Date().toISOString();

const initialVendors = [];

const useVendorStore = create((set, get) => ({
  vendors: initialVendors,

  addVendor: (vendorData) => {
    const id = `VND-${Date.now().toString().slice(-4)}`;
    const newVendor = {
      id,
      ...vendorData,
      status: vendorData.status || 'Aktif',
      rating: 0,
      review_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set(state => ({ vendors: [newVendor, ...state.vendors] }));
  },

  updateVendor: (id, vendorData) => {
    set(state => ({
      vendors: state.vendors.map(v => 
        v.id === id ? { ...v, ...vendorData, updated_at: new Date().toISOString() } : v
      )
    }));
  },

  toggleVendorStatus: (id) => {
    set(state => ({
      vendors: state.vendors.map(v => 
        v.id === id ? { ...v, status: v.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif', updated_at: new Date().toISOString() } : v
      )
    }));
  },

  deleteVendor: (id) => {
    set(state => ({
      vendors: state.vendors.filter(v => v.id !== id)
    }));
  }
}));

export default useVendorStore;
