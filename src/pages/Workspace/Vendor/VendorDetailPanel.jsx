import React, { useState } from 'react';
import { X, Star, Mail, Phone, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import usePaymentStore from '../../../store/usePaymentStore';
import useDocumentStore from '../../../store/useDocumentStore';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';
import UploadDocumentModal from '../UploadDocumentModal';

const VendorDetailPanel = ({ vendor, onClose, canEdit, onEdit }) => {
  const [activeTab, setActiveTab] = useState('Informasi');
  const [isUploading, setIsUploading] = useState(false);
  const { jobOrders } = usePaymentStore();
  const { documents } = useDocumentStore();

  // --- Performa Logic (Reuse from DashboardManager) ---
  const vendorJOs = jobOrders.filter(jo => jo.vendorName === vendor.nama || jo.vendorId === vendor.id);
  const totalJo = vendorJOs.length;
  const lunasJo = vendorJOs.filter(jo => jo.status === 'Lunas').length;
  
  let totalPay = 0;
  let onTimePay = 0;
  
  vendorJOs.forEach(jo => {
    jo.payments.forEach(p => {
      totalPay++;
      if (new Date(p.date) <= new Date(jo.dueDate)) {
        onTimePay++;
      }
    });
  });

  const biayaScore = totalJo > 0 ? (lunasJo / totalJo) * 100 : 0;
  const kepatuhanScore = totalPay > 0 ? (onTimePay / totalPay) * 100 : 100;
  const overallScore = (biayaScore + kepatuhanScore) / 2;

  // --- Dokumen Logic ---
  const vendorDocs = documents.filter(d => d.vendorId === vendor.id || (d.tags && d.tags.includes(vendor.id)));

  const tabs = ['Informasi', 'Performa', 'Dokumen', 'Riwayat'];

  return (
    <div style={{
      width: '400px',
      backgroundColor: 'var(--color-canvas)',
      borderLeft: '1px solid var(--color-hairline)',
      display: 'flex', flexDirection: 'column',
      boxShadow: '-4px 0 15px rgba(0,0,0,0.03)',
      zIndex: 10
    }}>
      {/* Header */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--color-hairline)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-48)' }}>
          <X size={20} />
        </button>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-canvas-parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>
            {vendor.service_type === 'Trucking' ? '🚛' : '🚢'}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 4px 0' }}>{vendor.nama}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Badge type="priority" value={vendor.service_type === 'Trucking' ? 'Sedang' : 'Tinggi'} labelOverride={vendor.service_type} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>
                <Star size={14} color="#ff9500" fill="#ff9500" />
                {vendor.rating.toFixed(1)} <span style={{ color: 'var(--color-ink-muted-48)', fontWeight: '400' }}>({vendor.review_count})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Nav */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-parchment)' }}>
        {tabs.map(t => (
          <button 
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              flex: 1, padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: activeTab === t ? '600' : '500',
              color: activeTab === t ? 'var(--color-primary)' : 'var(--color-ink-muted-48)',
              borderBottom: activeTab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        
        {activeTab === 'Informasi' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-ink-muted-48)', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>Kontak Utama</h3>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-ink)', marginBottom: '8px' }}>{vendor.kontak_nama}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-ink)', marginBottom: '8px' }}>
                <Mail size={14} color="var(--color-ink-muted-48)" /> {vendor.kontak_email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-ink)' }}>
                <Phone size={14} color="var(--color-ink-muted-48)" /> {vendor.kontak_telepon}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-ink-muted-48)', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>Alamat</h3>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--color-ink)', lineHeight: '1.5' }}>
                <MapPin size={16} color="var(--color-ink-muted-48)" style={{ flexShrink: 0, marginTop: '2px' }} /> 
                {vendor.alamat}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-ink-muted-48)', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>Layanan Tersedia</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {vendor.layanan.map((l, i) => (
                  <span key={i} style={{ backgroundColor: 'var(--color-canvas-parchment)', padding: '4px 10px', borderRadius: 'var(--rounded-md)', fontSize: '12px', border: '1px solid var(--color-hairline)' }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {vendor.catatan && (
              <div>
                <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-ink-muted-48)', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>Catatan</h3>
                <div style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: '1.5', padding: '12px', backgroundColor: 'var(--color-status-info-bg)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-status-info)' }}>
                  {vendor.catatan}
                </div>
              </div>
            )}
            
            {canEdit && (
              <Button variant="secondary" onClick={() => onEdit && onEdit(vendor)} style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}>
                Edit Informasi Vendor
              </Button>
            )}
          </div>
        )}

        {activeTab === 'Performa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '20px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'var(--shadow-product)' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-ink-muted-80)', fontWeight: '600' }}>Skor Keseluruhan</div>
              <div style={{ fontSize: '42px', fontWeight: '700', color: overallScore >= 80 ? 'var(--color-status-success)' : 'var(--color-status-warning)', margin: '8px 0' }}>
                {overallScore.toFixed(0)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Berdasarkan {totalJo} Job Orders</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Skor Biaya</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-ink)' }}>{biayaScore.toFixed(0)}%</div>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '4px' }}>Rasio Lunas</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Kepatuhan</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-ink)' }}>{kepatuhanScore.toFixed(0)}%</div>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '4px' }}>Pembayaran Tepat Waktu</div>
              </div>
            </div>
            
            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', lineHeight: '1.5', padding: '12px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: 'var(--rounded-md)' }}>
              Metrik performa di atas dihitung secara real-time dari data Financial Tracker (Dashboard Manager) sepanjang waktu.
            </div>
          </div>
        )}

        {activeTab === 'Dokumen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Button variant="primary" onClick={() => setIsUploading(true)} style={{ width: '100%', justifyContent: 'center' }}>Upload Dokumen Vendor</Button>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vendorDocs.length > 0 ? vendorDocs.map(d => (
                <div key={d.id} style={{ padding: '12px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={20} color="var(--color-ink-muted-48)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink)' }}>{d.fileName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>{d.type} • {d.date}</div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-ink-muted-48)', fontSize: '13px' }}>
                  Belum ada dokumen tertaut.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Riwayat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vendorJOs.length > 0 ? vendorJOs.map(jo => (
              <div key={jo.id} style={{ padding: '12px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--color-canvas)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{jo.id}</span>
                  <Badge type="status" value={jo.status} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginBottom: '4px' }}>Cost Type: {jo.costType}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--color-ink-muted-48)' }}>{new Date(jo.date).toLocaleDateString('id-ID')}</span>
                  <span style={{ fontWeight: '600', color: 'var(--color-ink)' }}>{jo.currency} {jo.totalInvoice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-ink-muted-48)', fontSize: '13px' }}>
                Belum ada transaksi dengan vendor ini.
              </div>
            )}
          </div>
        )}

      </div>

      {isUploading && (
        <UploadDocumentModal 
          onClose={() => setIsUploading(false)} 
          initialVendorId={vendor.id} 
          initialTags={vendor.id} 
        />
      )}
    </div>
  );
};

export default VendorDetailPanel;
