import React, { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Power, Star, Truck, Plane, CheckCircle2, XCircle } from 'lucide-react';
import useVendorStore from '../../../store/useVendorStore';
import usePaymentStore from '../../../store/usePaymentStore';
import useAuthStore from '../../../store/useAuthStore';
import { canWriteVendor } from '../../../utils/authHelpers';
import VendorDetailPanel from './VendorDetailPanel';
import VendorFormModal from './VendorFormModal';

const VendorManagementPage = () => {
  const { vendors, toggleVendorStatus, deleteVendor } = useVendorStore();
  const { jobOrders } = usePaymentStore();
  const { user } = useAuthStore();
  
  const canEdit = canWriteVendor(user);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterService, setFilterService] = useState('Semua');
  const [filterRegion, setFilterRegion] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState(null);

  // --- Calculations for KPI Cards ---
  const activeVendors = vendors.filter(v => v.status === 'Aktif').length;
  const inactiveVendors = vendors.filter(v => v.status === 'Tidak Aktif').length;
  
  const avgRating = vendors.length > 0 
    ? vendors.reduce((acc, v) => acc + (v.rating || 0), 0) / vendors.length 
    : 0;

  // Total transactions this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const trxThisMonth = jobOrders.filter(jo => {
    // Only count JOs that map to a vendor in our store
    const hasVendor = vendors.some(v => v.nama === jo.vendorName || v.id === jo.vendorId);
    if (!hasVendor) return false;
    const joDate = new Date(jo.date || new Date());
    return joDate.getMonth() === currentMonth && joDate.getFullYear() === currentYear;
  }).length;

  // --- Filtering ---
  const filteredVendors = vendors.filter(v => {
    const q = searchQuery.toLowerCase();
    const matchSearch = v.nama.toLowerCase().includes(q) || v.layanan.join(' ').toLowerCase().includes(q) || v.region.toLowerCase().includes(q);
    const matchService = filterService === 'Semua' || v.service_type === filterService;
    const matchRegion = filterRegion === 'Semua' || v.region === filterRegion;
    const matchStatus = filterStatus === 'Semua' || v.status === filterStatus;
    return matchSearch && matchService && matchRegion && matchStatus;
  });

  // --- Subcomponents ---
  const KPICard = ({ title, value, unit, color }) => (
    <div style={{
      backgroundColor: 'var(--color-canvas)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--rounded-lg)',
      padding: '20px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      boxShadow: 'var(--shadow-product)',
      flex: 1
    }}>
      <div style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
        {title}
      </div>
      <div style={{ fontSize: '28px', fontWeight: '700', color: color || 'var(--color-ink)' }}>
        {value} <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-ink-muted-48)' }}>{unit}</span>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const isAktif = status === 'Aktif';
    return (
      <span style={{
        backgroundColor: isAktif ? 'var(--color-status-success-bg)' : 'var(--color-status-neutral-bg)',
        color: isAktif ? 'var(--color-status-success)' : 'var(--color-status-neutral)',
        padding: '2px 8px', borderRadius: 'var(--rounded-xs)',
        fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
      }}>
        {status}
      </span>
    );
  };

  const ServiceIcon = ({ type }) => {
    return type === 'Trucking' 
      ? <Truck size={16} color="var(--color-ink-muted-48)" /> 
      : <Plane size={16} color="var(--color-ink-muted-48)" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px 20px', backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', letterSpacing: '-0.374px', margin: '0 0 4px 0', color: 'var(--color-ink)' }}>
              Manajemen Vendor
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-48)', margin: 0 }}>
              Kelola daftar vendor Trucking dan Forwarder, evaluasi performa, dan riwayat transaksi.
            </p>
          </div>
          {canEdit && (
            <button onClick={() => setIsAddingVendor(true)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', borderRadius: 'var(--rounded-pill)',
              backgroundColor: 'var(--color-primary)', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
            }}>
              <Plus size={16} /> Tambah Vendor
            </button>
          )}
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <KPICard title="Total Vendor" value={vendors.length} />
          <KPICard title="Vendor Aktif" value={activeVendors} color="var(--color-status-success)" />
          <KPICard title="Tidak Aktif" value={inactiveVendors} color="var(--color-status-neutral)" />
          <KPICard title="Rata-rata Rating" value={avgRating.toFixed(1)} unit="/ 5.0" />
          <KPICard title="Transaksi (Bulan Ini)" value={trxThisMonth} unit="JO" color="var(--color-primary)" />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
          
          {/* Controls */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} color="var(--color-ink-muted-48)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Cari nama, layanan, region..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 40px',
                  border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)',
                  backgroundColor: 'var(--color-canvas)', outline: 'none', fontSize: '14px'
                }} 
              />
            </div>
            
            <select value={filterService} onChange={e => setFilterService(e.target.value)} style={{ padding: '10px 16px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--color-canvas)', outline: 'none', fontSize: '14px' }}>
              <option value="Semua">Semua Layanan</option>
              <option value="Trucking">Trucking</option>
              <option value="Forwarder">Forwarder</option>
            </select>
            
            <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ padding: '10px 16px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--color-canvas)', outline: 'none', fontSize: '14px' }}>
              <option value="Semua">Semua Region</option>
              {Array.from(new Set(vendors.map(v => v.region))).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '10px 16px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--color-canvas)', outline: 'none', fontSize: '14px' }}>
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-product)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-canvas-parchment)' }}>
                  {['Vendor', 'Layanan & Region', 'Kontak Utama', 'Status', 'Rating', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--color-hairline)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map(v => (
                  <tr key={v.id} 
                    onClick={() => setSelectedVendor(v)}
                    style={{ 
                      cursor: 'pointer', 
                      backgroundColor: selectedVendor?.id === v.id ? 'var(--color-status-info-bg)' : 'transparent',
                      borderBottom: '1px solid var(--color-hairline)',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={e => { if (selectedVendor?.id !== v.id) e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)' }}
                    onMouseLeave={e => { if (selectedVendor?.id !== v.id) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ServiceIcon type={v.service_type} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{v.nama}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', fontFamily: 'monospace' }}>{v.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink)' }}>{v.service_type}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{v.region}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--color-ink)' }}>{v.kontak_nama}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{v.kontak_email}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <StatusBadge status={v.status} />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}>
                        <Star size={14} color="#ff9500" fill="#ff9500" />
                        {v.rating.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>{v.review_count} ulasan</div>
                    </td>
                    <td style={{ padding: '16px' }} onClick={e => e.stopPropagation()}>
                      {canEdit && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => toggleVendorStatus(v.id)} title="Toggle Status" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-48)' }}>
                            <Power size={16} />
                          </button>
                          <button onClick={() => { if(confirm('Hapus vendor ini?')) deleteVendor(v.id) }} title="Hapus" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-status-danger)' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredVendors.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
                      Tidak ada vendor yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Detail Panel */}
        {selectedVendor && (
          <VendorDetailPanel 
            vendor={selectedVendor} 
            onClose={() => setSelectedVendor(null)} 
            canEdit={canEdit} 
            onEdit={(v) => setVendorToEdit(v)}
          />
        )}
      </div>

      {/* Modals */}
      {isAddingVendor && <VendorFormModal onClose={() => setIsAddingVendor(false)} />}
      {vendorToEdit && <VendorFormModal initialData={vendorToEdit} onClose={() => { setVendorToEdit(null); setSelectedVendor(null); }} />}
    </div>
  );
};

export default VendorManagementPage;
