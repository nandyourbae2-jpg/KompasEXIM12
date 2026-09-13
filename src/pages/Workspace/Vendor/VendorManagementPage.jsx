import React, { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Power, Star, Truck, Plane, CheckCircle2, XCircle, Eye, MoreHorizontal, Shield } from 'lucide-react';
import useVendorStore from '../../../store/useVendorStore';
import usePaymentStore from '../../../store/usePaymentStore';
import useAuthStore from '../../../store/useAuthStore';
import { canWriteVendor } from '../../../utils/authHelpers';
import { useAppleModal } from '../../../contexts/AppleModalContext';
import VendorDetailPanel from './VendorDetailPanel';
import VendorFormModal from './VendorFormModal';
import VendorReviewModal from './VendorReviewModal';

// getVendorPerformance logic is now handled in the backend

const VendorManagementPage = () => {
  const { vendors, toggleVendorStatus, deleteVendor, fetchVendors } = useVendorStore();
  const { jobOrders } = usePaymentStore();
  const { user } = useAuthStore();
  const { confirm, alert } = useAppleModal();
  
  const canEdit = canWriteVendor(user);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterService, setFilterService] = useState('Semua');
  const [filterRegion, setFilterRegion] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Aktif');
  
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState(null);
  const [vendorToReview, setVendorToReview] = useState(null);

  React.useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // --- Calculations for KPI Cards ---
  const activeVendors = vendors.filter(v => v.status === 'Aktif').length;
  const inactiveVendors = vendors.filter(v => v.status === 'Tidak Aktif').length;
  const needsReviewCount = vendors.filter(v => v.review_status === 'NEEDS_REVIEW').length;
  
  const notRatedCount = vendors.filter(v => 
    v.status === 'Aktif' && 
    v.review_status === 'CONFIRMED' && 
    (v.rating === 0 || !v.rating || v.review_count === 0)
  ).length;

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
    const matchSearch = v.nama.toLowerCase().includes(q) || v.layanan.join(' ').toLowerCase().includes(q) || (v.region || '').toLowerCase().includes(q);
    const matchService = filterService === 'Semua' || v.service_type === filterService;
    const matchRegion = filterRegion === 'Semua' || v.region === filterRegion;
    const matchStatus = filterStatus === 'Semua' 
      ? true 
      : filterStatus === 'Business Review' 
        ? v.review_status === 'NEEDS_REVIEW' 
        : v.status === filterStatus;
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
          <KPICard title="Vendor Aktif" value={activeVendors} color="var(--color-status-success)" />
          <KPICard title="Business Review" value={needsReviewCount} color="var(--color-status-warning)" />
          <KPICard title="Belum Dinilai" value={notRatedCount} color="var(--color-status-info)" />
          <KPICard title="Non-Aktif" value={inactiveVendors} color="var(--color-status-neutral)" />
        </div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-ink-muted-48)', paddingLeft: '4px' }}>
          {vendors.length} total master records
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
              <option value="Both">Forwarder + Trucking (Both)</option>
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
              <option value="Business Review">Business Review</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', boxShadow: 'var(--shadow-product)', maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-canvas-parchment)' }}>
                  {['Vendor', 'Layanan & Region', 'Kontak Utama', 'Status', 'Rating', 'Aksi'].map(h => (
                    <th key={h} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--color-canvas-parchment)', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--color-hairline)', boxShadow: '0 1px 0 var(--color-hairline)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map(v => {
                  const rating = v.rating || 0;
                  const review_count = v.review_count || 0;
                  const isRated = review_count > 0;
                  
                  let classificationLabel = 'Belum Dinilai';
                  if (isRated) {
                    if (v.classification === 'EXCELLENT') classificationLabel = 'Sangat Baik';
                    else if (v.classification === 'VERY_GOOD') classificationLabel = 'Baik Sekali';
                    else if (v.classification === 'GOOD') classificationLabel = 'Baik';
                    else if (v.classification === 'FAIR') classificationLabel = 'Cukup';
                    else if (v.classification === 'POOR') classificationLabel = 'Kurang';
                  }
                  return (
                    <tr 
                      key={v.id} 
                      style={{ 
                        borderBottom: '1px solid var(--color-hairline)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        backgroundColor: selectedVendor?.id === v.id ? 'var(--color-status-info-bg)' : 'transparent'
                      }}
                      onMouseEnter={(e) => { if(selectedVendor?.id !== v.id) e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)' }}
                      onMouseLeave={(e) => { if(selectedVendor?.id !== v.id) e.currentTarget.style.backgroundColor = 'transparent' }}
                      onClick={() => setSelectedVendor(v)}
                    >
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {v.service_type === 'Trucking' ? <Truck size={16} color="var(--color-ink-muted-48)" /> : v.service_type === 'Forwarder' ? <Plane size={16} color="var(--color-ink-muted-48)" /> : <div style={{display:'flex', gap:'2px'}}><Plane size={14} color="var(--color-ink-muted-48)" /><Truck size={14} color="var(--color-ink-muted-48)" /></div>}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '4px' }}>{v.nama}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', fontFamily: 'monospace' }}>{v.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink)' }}>{v.service_type}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{v.region}</div>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '13px', color: 'var(--color-ink)' }}>{v.kontak_nama}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{v.kontak_email}</div>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '11px', 
                          fontWeight: '600',
                          backgroundColor: v.status === 'Aktif' ? 'var(--color-status-success-bg)' : 'var(--color-status-neutral-bg)',
                          color: v.status === 'Aktif' ? 'var(--color-status-success)' : 'var(--color-status-neutral)',
                          textTransform: 'uppercase',
                          marginBottom: '4px'
                        }}>
                          {v.status}
                        </span>
                        {v.review_status === 'NEEDS_REVIEW' && (
                          <span style={{ 
                            display: 'block',
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: '600',
                            backgroundColor: 'var(--color-status-warning-bg)',
                            color: 'var(--color-status-warning)',
                            textTransform: 'uppercase',
                            width: 'fit-content'
                          }}>
                            NEEDS REVIEW
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        {isRated ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>
                              <Star size={14} color="#ff9500" fill="#ff9500" />
                              {rating.toFixed(2)} <span style={{ fontWeight: '400', color: 'var(--color-ink-muted-48)' }}>/ 5.0</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '2px' }}>
                              {classificationLabel} ({review_count} evaluasi)
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)' }}>
                            Belum Dinilai
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                        {v.review_status === 'NEEDS_REVIEW' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setVendorToReview(v); }}
                            style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-status-warning-bg)', border: '1px solid var(--color-status-warning)', borderRadius: 'var(--rounded-md)', color: 'var(--color-status-warning)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            <Eye size={14} /> Review
                          </button>
                        ) : (
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-ink-muted-48)' }}>
                            <MoreHorizontal size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                );
              })}
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
      {vendorToReview && <VendorReviewModal vendor={vendorToReview} onClose={() => setVendorToReview(null)} />}
    </div>
  );
};

export default VendorManagementPage;
