import React, { useState, useEffect, useRef } from 'react';
import usePaymentStore from '../../../store/usePaymentStore';
import useAuthStore from '../../../store/useAuthStore';
import Button from '../../../components/Button';
import { UploadCloud, CheckCircle2, ChevronDown } from 'lucide-react';

const AddInvoiceModal = ({ onClose }) => {
  const { jobOrders, addInvoice } = usePaymentStore();
  const { user } = useAuthStore();
  
  const [joId, setJoId] = useState('');
  const [joSearchQuery, setJoSearchQuery] = useState('');
  const [isJoDropdownOpen, setIsJoDropdownOpen] = useState(false);
  
  const [vendorName, setVendorName] = useState('Samudera Shipping');
  const [customVendorName, setCustomVendorName] = useState('');
  const [costType, setCostType] = useState('Ocean Freight');
  const [currency, setCurrency] = useState('IDR');
  
  const [totalInvoiceStr, setTotalInvoiceStr] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  
  const [fileMock, setFileMock] = useState(null);
  const [formError, setFormError] = useState('');
  
  const comboboxRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsJoDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableJoIds = ["JO-2024-0715", "JO-2024-0716", "JO-2024-0717", "JO-2024-0718"];
  const filteredJoIds = availableJoIds.filter(id => id.toLowerCase().includes(joSearchQuery.toLowerCase()));

  const handleTotalInvoiceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setTotalInvoiceStr('');
      return;
    }
    const formatted = parseInt(rawValue, 10).toLocaleString('id-ID');
    setTotalInvoiceStr(formatted);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileMock(e.target.files[0]);
    }
  };

  const handleSave = () => {
    if (!joId.trim()) {
      setFormError('Job Order ID wajib diisi'); return;
    }
    if (jobOrders.some(jo => jo.id === joId)) {
      setFormError('Job Order ID sudah terdaftar. Gunakan Update Pembayaran.'); return;
    }
    
    const finalVendor = vendorName === '+ Vendor baru' ? customVendorName : vendorName;
    if (!finalVendor.trim()) {
      setFormError('Nama Vendor wajib diisi'); return;
    }
    
    const amount = parseInt(totalInvoiceStr.replace(/\./g, ''), 10);
    if (!amount || amount <= 0) {
      setFormError('Total Invoice wajib diisi dan > 0'); return;
    }

    if (!fileMock) {
      setFormError('Dokumen Invoice wajib diupload'); return;
    }

    addInvoice({
      id: joId,
      vendorName: finalVendor,
      costType,
      currency,
      totalInvoice: amount,
      invoiceDate
    }, fileMock, user);

    onClose();
  };

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modal: {
      backgroundColor: 'var(--color-canvas)', padding: 'var(--spacing-xl)', borderRadius: 'var(--rounded-lg)',
      width: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-product)', 
      display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', fontFamily: 'var(--font-family-body)'
    },
    header: {
      display: 'flex', flexDirection: 'column', gap: '4px'
    },
    title: {
      fontFamily: 'var(--font-family-display)', fontSize: '28px', fontWeight: '600', margin: 0, letterSpacing: '0.196px'
    },
    errorBox: {
      backgroundColor: 'var(--color-badge-critical)', color: '#fff', padding: '12px 16px', borderRadius: 'var(--rounded-sm)', fontSize: '14px', fontWeight: '600'
    },
    inputGroup: {
      display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative'
    },
    labelSmall: {
      fontSize: '14px', color: 'var(--color-ink-muted-80)', fontWeight: '600'
    },
    input: {
      width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', 
      fontSize: '17px', fontFamily: 'var(--font-family-body)', outline: 'none', boxSizing: 'border-box'
    },
    dropdownList: {
      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
      backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)',
      boxShadow: 'var(--shadow-divider)', maxHeight: '150px', overflowY: 'auto', marginTop: '4px'
    },
    dropdownItem: {
      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-divider-soft)'
    },
    uploadArea: {
      border: '2px dashed var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '32px', textAlign: 'center', 
      backgroundColor: fileMock ? '#e5f9eb' : 'var(--color-canvas-parchment)', 
      borderColor: fileMock ? '#34c759' : 'var(--color-hairline)', cursor: 'pointer', position: 'relative'
    },
    footer: {
      display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--spacing-md)'
    }
  };

  const isFormValid = joId && totalInvoiceStr && fileMock;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        
        <div style={styles.header}>
          <h2 style={styles.title}>Tambah Tagihan Baru</h2>
        </div>
        
        {formError && <div style={styles.errorBox}>{formError}</div>}

        <div style={styles.inputGroup} ref={comboboxRef}>
          <label style={styles.labelSmall}>Job Order ID *</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              value={joSearchQuery}
              onChange={(e) => {
                setJoSearchQuery(e.target.value);
                setJoId(e.target.value);
                setIsJoDropdownOpen(true);
              }}
              onFocus={() => setIsJoDropdownOpen(true)}
              placeholder="mis. JO-2024-0715" 
              style={{...styles.input, paddingRight: '40px'}}
            />
            <ChevronDown size={18} color="var(--color-ink-muted-48)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          {isJoDropdownOpen && filteredJoIds.length > 0 && (
            <div style={styles.dropdownList}>
              {filteredJoIds.map(id => (
                <div 
                  key={id}
                  style={styles.dropdownItem}
                  onClick={() => {
                    setJoSearchQuery(id); setJoId(id); setIsJoDropdownOpen(false);
                  }}
                >
                  {id}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.labelSmall}>Vendor Name *</label>
          <select value={vendorName} onChange={e => setVendorName(e.target.value)} style={styles.input}>
            <option value="Samudera Shipping">Samudera Shipping</option>
            <option value="Meratus Line">Meratus Line</option>
            <option value="Tanto Intim">Tanto Intim</option>
            <option value="SPIL">SPIL</option>
            <option value="+ Vendor baru">+ Vendor baru</option>
          </select>
        </div>
        
        {vendorName === '+ Vendor baru' && (
          <div style={styles.inputGroup}>
            <label style={styles.labelSmall}>Nama Vendor Baru *</label>
            <input type="text" value={customVendorName} onChange={e => setCustomVendorName(e.target.value)} placeholder="Masukkan nama vendor" style={styles.input} />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={styles.inputGroup}>
            <label style={styles.labelSmall}>Cost Type</label>
            <select value={costType} onChange={e => setCostType(e.target.value)} style={styles.input}>
              <option value="Ocean Freight">Ocean Freight</option>
              <option value="THC">THC</option>
              <option value="Custom Duty">Custom Duty</option>
              <option value="Demurrage">Demurrage</option>
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.labelSmall}>Mata Uang</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} style={styles.input}>
              <option value="IDR">IDR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.labelSmall}>Total Invoice *</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted-48)', fontWeight: '600' }}>
              {currency === 'IDR' ? 'Rp' : '$'}
            </span>
            <input 
              type="text" 
              value={totalInvoiceStr} 
              onChange={handleTotalInvoiceChange} 
              placeholder="0" 
              style={{...styles.input, paddingLeft: '50px'}} 
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.labelSmall}>Tanggal Invoice (Opsional)</label>
          <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} style={styles.input} />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.labelSmall}>Dokumen Invoice *</label>
          <div style={styles.uploadArea}>
            <UploadCloud size={32} color={fileMock ? "#34c759" : "var(--color-ink-muted-48)"} style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '14px', color: fileMock ? '#108034' : 'var(--color-ink-muted-80)', fontWeight: '600' }}>
              {fileMock ? fileMock.name : 'Drag & drop atau klik untuk upload dokumen'}
            </div>
            <input type="file" onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
          </div>
        </div>
        
        <div style={styles.footer}>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={handleSave} disabled={!isFormValid}>
            Simpan Tagihan
          </Button>
        </div>

      </div>
    </div>
  );
};

export default AddInvoiceModal;
