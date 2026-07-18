import React, { useState } from 'react';
import useDocumentStore from '../../store/useDocumentStore';
import useAuthStore from '../../store/useAuthStore';
import Button from '../../components/Button';

const UploadDocumentModal = ({ onClose, initialVendorId = '', initialTags = '' }) => {
  const { uploadDocument } = useDocumentStore();
  const { user } = useAuthStore();
  
  const [file, setFile] = useState(null);
  const [type, setType] = useState('Invoice');
  const [reference, setReference] = useState('');
  const [department, setDepartment] = useState('Import');
  const [tags, setTags] = useState(initialTags);
  const [vendorId, setVendorId] = useState(initialVendorId);
  const [formError, setFormError] = useState('');
  
  const handleSave = () => {
    if (!file || !reference.trim()) {
      setFormError('File dan Nomor Referensi wajib diisi');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran file maksimal adalah 5MB');
      return;
    }
    
    uploadDocument({
      fileName: file.name,
      type,
      reference,
      department,
      vendorId,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t !== '') : []
    }, file, user);
    
    onClose();
  };
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--color-canvas)', padding: '32px', borderRadius: 'var(--rounded-lg)',
        width: '400px', boxShadow: 'var(--shadow-product)', display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Upload Dokumen</h2>
        
        {formError && (
          <div style={{ backgroundColor: 'var(--color-badge-critical)', color: '#fff', padding: '8px 12px', borderRadius: 'var(--rounded-sm)', fontSize: '14px' }}>
            {formError}
          </div>
        )}
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Pilih File *</label>
          <input type="file" onChange={e => setFile(e.target.files[0])} style={{ width: '100%', padding: '8px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', fontSize: '15px', outline: 'none' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Tipe Dokumen</label>
          <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', fontSize: '15px', outline: 'none' }}>
            <option value="Invoice">Invoice</option>
            <option value="Packing List">Packing List</option>
            <option value="Health Certificate">Health Certificate</option>
            <option value="Certificate Of Origin">Certificate Of Origin</option>
            <option value="Bill Of Lading">Bill Of Lading</option>
            <option value="Catch Certificate">Catch Certificate</option>
            <option value="Captain Statement">Captain Statement</option>
            <option value="Dolphin Safe Certificate">Dolphin Safe Certificate</option>
            <option value="Certificate Of Analysis">Certificate Of Analysis</option>
            <option value="Prior Notice">Prior Notice</option>
            {/* TIPE DOKUMEN BARU DITAMBAHKAN DI SINI */}
            <option value="Manifest">Manifest</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Nomor Referensi (B/L atau SO) *</label>
          <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="cth: BL-20240712" style={{ width: '100%', padding: '12px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', fontSize: '15px', outline: 'none' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Departemen</label>
          <select value={department} onChange={e => setDepartment(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', fontSize: '15px', outline: 'none' }}>
            <option value="Import">Import</option>
            <option value="Export">Export</option>
            <option value="Administrasi Export (AE)">Administrasi Export (AE)</option>
            <option value="Account Officer">Account Officer</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Tag (Pisahkan dengan koma)</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="cth: Urgent, Copy" style={{ width: '100%', padding: '12px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', fontSize: '15px', outline: 'none' }} />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={handleSave}>Simpan</Button>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentModal;
