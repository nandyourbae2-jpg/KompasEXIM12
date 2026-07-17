import { create } from 'zustand';

// Dummy list lama dari truckingList
// { code: 'ATS', name: 'Adhirajasa Trucking Sejahtera' },
// { code: 'SMC', name: 'Samudera Cargo' },
// { code: 'SPL', name: 'SPIL Trucking' },

const now = new Date().toISOString();

const initialVendors = [
  {
    id: 'VND-ATS',
    nama: 'Adhirajasa Trucking Sejahtera',
    service_type: 'Trucking',
    region: 'Jakarta',
    status: 'Aktif',
    rating: 4.5,
    review_count: 12,
    kontak_nama: 'Budi Santoso',
    kontak_email: 'budi@ats-trucking.com',
    kontak_telepon: '081234567890',
    alamat: 'Jl. Raya Cakung Cilincing No. 45, Jakarta Utara',
    layanan: ['Trucking FCL 20ft', 'Trucking FCL 40ft', 'Reefer Container'],
    catatan: 'Vendor prioritas untuk rute Tanjung Priok - Cikarang.',
    created_at: now,
    updated_at: now,
  },
  {
    id: 'VND-SMC',
    nama: 'Samudera Cargo',
    service_type: 'Trucking',
    region: 'Tanjung Priok',
    status: 'Aktif',
    rating: 4.2,
    review_count: 8,
    kontak_nama: 'Siti Aminah',
    kontak_email: 'siti@samuderacargo.co.id',
    kontak_telepon: '081345678901',
    alamat: 'Kawasan Berikat Nusantara, Tanjung Priok',
    layanan: ['Trucking LCL', 'Trucking FCL 20ft'],
    catatan: '',
    created_at: now,
    updated_at: now,
  },
  {
    id: 'VND-SPL',
    nama: 'SPIL Trucking',
    service_type: 'Trucking',
    region: 'Cikarang',
    status: 'Aktif',
    rating: 4.8,
    review_count: 24,
    kontak_nama: 'Agus Riyanto',
    kontak_email: 'agus.riyanto@spil.co.id',
    kontak_telepon: '081987654321',
    alamat: 'Kawasan Industri Cikarang, Bekasi',
    layanan: ['Trucking FCL 40ft', 'Flatbed Container'],
    catatan: 'Spesialis untuk gudang Cikarang dan Karawang.',
    created_at: now,
    updated_at: now,
  }
];

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
