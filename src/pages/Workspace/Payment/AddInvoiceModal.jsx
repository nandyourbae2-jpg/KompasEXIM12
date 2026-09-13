import React, { useState, useEffect, useRef } from 'react';
import usePaymentStore from '../../../store/usePaymentStore';
import useAuthStore from '../../../store/useAuthStore';
import useImportProjectStore from '../../../store/useImportProjectStore';
import useVendorStore from '../../../store/useVendorStore';
import VendorSelect from '../../../components/VendorSelect';
import Button from '../../../components/Button';
import { UploadCloud, CheckCircle2, ChevronDown, AlertCircle } from 'lucide-react';
import { useFormSubmit } from '../../../hooks/useFormSubmit';

const AddInvoiceModal = ({ onClose }) => {
  const { jobOrders, addInvoice } = usePaymentStore();
  const { importProjects, fetchImportProjects } = useImportProjectStore();
  const { vendors, fetchVendors } = useVendorStore();
  const { user } = useAuthStore();
  
  const [joId, setJoId] = useState('');
  const [joSearchQuery, setJoSearchQuery] = useState('');
  const [isJoDropdownOpen, setIsJoDropdownOpen] = useState(false);
  
  const [vendorName, setVendorName] = useState('');
  const [customVendorName, setCustomVendorName] = useState('');
  const [costType, setCostType] = useState('Ocean Freight');
  const [currency, setCurrency] = useState('IDR');
  
  const [dppStr, setDppStr] = useState('');
  const [persenPpn, setPersenPpn] = useState('0');
  const [invoiceDate, setInvoiceDate] = useState('');
  
  const [fileMock, setFileMock] = useState(null);
  
  const comboboxRef = useRef(null);

  useEffect(() => {
    fetchImportProjects();
    fetchVendors();
  }, [fetchImportProjects, fetchVendors]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsJoDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredJoIds = importProjects
    .map(p => p.taskUniqueNumber)
    .filter(Boolean)
    .filter(id => id.toLowerCase().includes(joSearchQuery.toLowerCase()));

  const handleDppChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setDppStr('');
      return;
    }
    const formatted = parseInt(rawValue, 10).toLocaleString('id-ID');
    setDppStr(formatted);
  };
  
  const dppNum = parseInt(dppStr.replace(/\./g, ''), 10) || 0;
  const ppnNum = parseFloat(persenPpn) || 0;
  const taxNum = (dppNum * ppnNum) / 100;
  const totalNum = dppNum + taxNum;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileMock(e.target.files[0]);
    }
  };

  const { handleSubmit: handleSave, loading: submitting, error: submitError, fieldErrors, setFieldErrors } = useFormSubmit(
    async () => {
      const finalVendor = vendorName;
      const amount = dppNum;

      if (!joId.trim() || !finalVendor.trim() || !amount || amount <= 0) {
        setFieldErrors({
          joId: !joId.trim() ? 'Wajib' : null,
          vendorName: !finalVendor.trim() ? 'Wajib' : null,
          dppNum: (!amount || amount <= 0) ? 'Wajib > 0' : null
        });
        throw new Error('Mohon lengkapi semua field wajib');
      }

      if (jobOrders.some(jo => jo.id === joId)) {
        throw new Error('Job Order ID sudah terdaftar. Gunakan Update Pembayaran.');
      }
      
      await addInvoice({
        id: joId,
        vendorName: finalVendor,
        costType,
        currency,
        dpp: amount,
        persen_ppn: ppnNum,
        invoiceDate
      }, fileMock, user);

      onClose();
    }
  );

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

  const isFormValid = joId && dppStr && fileMock;
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        
        <div style={styles.header}>
          <h2 style={styles.title}>Invoice / Tagihan Baru</h2>
        </div>
        
        {submitError && (
          <div style={{ backgroundColor: '#fff1f1', color: '#d32f2f', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {submitError}
          </div>
        )}

        <div style={styles.inputGroup} ref={comboboxRef}>
          <label style={styles.labelSmall}>IMP NO (Based on Import Project) *</label>
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
              placeholder="mis. IMP-015-2026" 
              style={{...styles.input, paddingRight: '40px', border: fieldErrors.joId ? '1px solid var(--color-status-danger)' : styles.input.border}}
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
          <VendorSelect 
            value={vendorName} 
            onChange={setVendorName} 
            style={styles.input} 
            placeholder="Pilih atau ketik nama vendor" 
          />
        </div>

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

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div style={styles.inputGroup}>
            <label style={styles.labelSmall}>DPP *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted-48)', fontWeight: '600' }}>
                {currency === 'IDR' ? 'Rp' : '$'}
              </span>
              <input 
                type="text" 
                value={dppStr} 
                onChange={handleDppChange} 
                placeholder="0" 
                style={{...styles.input, paddingLeft: '50px'}} 
              />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.labelSmall}>%PPN *</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                value={persenPpn} 
                onChange={e => setPersenPpn(e.target.value)} 
                placeholder="0" 
                style={{...styles.input, paddingRight: '40px'}} 
              />
              <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted-48)', fontWeight: '600' }}>
                %
              </span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--color-canvas-parchment)', padding: '16px', borderRadius: 'var(--rounded-sm)', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--color-hairline)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>
            <span>Tax ({ppnNum}%)</span>
            <span>{currency === 'IDR' ? 'Rp' : '$'} {taxNum.toLocaleString('id-ID')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: 'var(--color-ink)', fontWeight: '700' }}>
            <span>Total Invoice</span>
            <span>{currency === 'IDR' ? 'Rp' : '$'} {totalNum.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.labelSmall}>Tanggal Invoice (Opsional)</label>
          <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} style={styles.input} />
        </div>
        
        <div style={styles.footer}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Batal</Button>
          <Button variant="primary" onClick={handleSave} disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
            {submitting ? 'Menyimpan...' : 'Simpan Data Invoice'}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default AddInvoiceModal;
