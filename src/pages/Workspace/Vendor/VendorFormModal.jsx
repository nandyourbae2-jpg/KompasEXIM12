import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import useVendorStore from '../../../store/useVendorStore';
import Button from '../../../components/Button';

const VendorFormModal = ({ onClose, initialData = null }) => {
  const { addVendor, updateVendor } = useVendorStore();

  const [formData, setFormData] = useState({
    nama: '',
    service_type: 'Trucking',
    region: 'Jakarta',
    status: 'Aktif',
    kontak_nama: '',
    kontak_email: '',
    kontak_telepon: '',
    alamat: '',
    layanan: '',
    catatan: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        layanan: initialData.layanan ? initialData.layanan.join(', ') : '',
      });
    }
  }, [initialData]);

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.nama.trim() || !formData.region.trim()) {
      setError('Nama dan Region wajib diisi.');
      return;
    }

    const payload = {
      ...formData,
      layanan: formData.layanan.split(',').map(s => s.trim()).filter(s => s !== ''),
    };

    if (initialData) {
      updateVendor(initialData.id, payload);
    } else {
      addVendor(payload);
    }
    
    onClose();
  };

  const inputSt = {
    width: '100%', padding: '10px 12px',
    border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)',
    fontSize: '14px', outline: 'none', backgroundColor: 'var(--color-canvas)',
    boxSizing: 'border-box'
  };

  const labelSt = {
    display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)'
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
    }}>
      <div style={{
        width: '600px', maxHeight: '90vh', overflowY: 'auto',
        backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)',
        display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-product)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-hairline)', position: 'sticky', top: 0, backgroundColor: 'var(--color-canvas)', zIndex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: 'var(--color-ink)' }}>
            {initialData ? 'Edit Vendor' : 'Tambah Vendor Baru'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-48)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '12px', backgroundColor: 'var(--color-status-danger-bg)', color: 'var(--color-status-danger)', borderRadius: 'var(--rounded-sm)', fontSize: '13px' }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelSt}>Nama Vendor *</label>
              <input type="text" name="nama" value={formData.nama} onChange={handleChange} style={inputSt} placeholder="PT. Vendor..." />
            </div>
            <div>
              <label style={labelSt}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} style={inputSt}>
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
            <div>
              <label style={labelSt}>Service Type</label>
              <select name="service_type" value={formData.service_type} onChange={handleChange} style={inputSt}>
                <option value="Trucking">Trucking</option>
                <option value="Forwarder">Forwarder</option>
              </select>
            </div>
            <div>
              <label style={labelSt}>Region *</label>
              <input type="text" name="region" value={formData.region} onChange={handleChange} style={inputSt} placeholder="Cikarang, Priok, dll" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-hairline)', margin: '8px 0' }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelSt}>Kontak Utama (Nama)</label>
              <input type="text" name="kontak_nama" value={formData.kontak_nama} onChange={handleChange} style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Telepon</label>
              <input type="text" name="kontak_telepon" value={formData.kontak_telepon} onChange={handleChange} style={inputSt} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelSt}>Email</label>
              <input type="email" name="kontak_email" value={formData.kontak_email} onChange={handleChange} style={inputSt} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-hairline)', margin: '8px 0' }} />

          <div>
            <label style={labelSt}>Alamat</label>
            <textarea name="alamat" value={formData.alamat} onChange={handleChange} style={{ ...inputSt, resize: 'vertical', minHeight: '60px' }} />
          </div>

          <div>
            <label style={labelSt}>Layanan Tersedia (Pisahkan dengan koma)</label>
            <input type="text" name="layanan" value={formData.layanan} onChange={handleChange} style={inputSt} placeholder="FCL 20ft, LCL, Reefer" />
          </div>

          <div>
            <label style={labelSt}>Catatan Internal</label>
            <textarea name="catatan" value={formData.catatan} onChange={handleChange} style={{ ...inputSt, resize: 'vertical', minHeight: '60px' }} />
          </div>
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'flex-end', gap: '12px', position: 'sticky', bottom: 0, backgroundColor: 'var(--color-canvas)', zIndex: 1 }}>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={handleSave}>Simpan Vendor</Button>
        </div>
      </div>
    </div>
  );
};

export default VendorFormModal;
