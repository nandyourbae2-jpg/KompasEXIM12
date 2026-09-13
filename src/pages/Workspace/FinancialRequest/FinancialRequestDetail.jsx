import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, CheckCircle, Activity, Plus, Edit2, Check } from 'lucide-react';
import Button from '../../../components/Button';
import { api } from '../../../lib/api';
import VendorSelect from '../../../components/VendorSelect';

const fmtRupiah = (val) => {
  const n = Number(val) || 0;
  return `IDR ${new Intl.NumberFormat('id-ID').format(n)}`;
};

const FinancialRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  }, []);

  // Modals state
  const [editItem, setEditItem] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedLedgers, setSelectedLedgers] = useState([]);

  // Category state
  const [masterCategories, setMasterCategories] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form state
  const [formVendor, setFormVendor] = useState('');
  const [formInvoice, setFormInvoice] = useState('');
  const [formActual, setFormActual] = useState('');
  const [formKeterangan, setFormKeterangan] = useState(''); // For manual cost
  const [formCategory, setFormCategory] = useState('Lain-lain'); // For manual cost

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api(`/financial-request-ledger?import_project_id=${id}`);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api('/master-kategori-biaya-manual');
      if (Array.isArray(res)) setMasterCategories(res);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    loadData();
    loadCategories();
  }, [id]);

  const closePanel = () => {
    navigate('/workspace/financial-request');
  };

  const handleUpdateLine = async () => {
    if (!editItem) return;
    try {
      await api(`/financial-request-ledger/${editItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          vendor_nama: formVendor,
          invoice_no: formInvoice,
          actual_amount: formActual
        })
      });
      setEditItem(null);
      loadData();
    } catch (err) {
      alert("Gagal update data: " + err.message);
    }
  };

  const handlePushToPayment = async () => {
    if (selectedLedgers.length === 0) return;
    try {
      await api(`/financial-request-ledger/push-to-payment`, {
        method: 'POST',
        body: JSON.stringify({
          ledger_ids: selectedLedgers
        })
      });
      alert('Berhasil diajukan ke Monitoring Pembayaran!');
      setSelectedLedgers([]);
      loadData();
    } catch (err) {
      alert('Gagal mengajukan ke Pembayaran: ' + err.message);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await api('/master-kategori-biaya-manual', {
        method: 'POST',
        body: JSON.stringify({ nama_kategori: newCategoryName })
      });
      setMasterCategories([...masterCategories, res]);
      setFormCategory(res.nama_kategori);
      setIsAddingCategory(false);
      setNewCategoryName('');
    } catch (err) {
      alert("Gagal tambah kategori: " + err.message);
    }
  };

  const handleAddManual = async () => {
    try {
      await api(`/financial-request-ledger/manual`, {
        method: 'POST',
        body: JSON.stringify({
          import_project_id: id,
          keterangan: formKeterangan,
          vendor_nama: formVendor,
          invoice_no: formInvoice,
          dpp: formActual,
          persen_ppn: 0,
          cost_category: formCategory
        })
      });
      setShowManualModal(false);
      setFormKeterangan('');
      setFormVendor('');
      setFormInvoice('');
      setFormActual('');
      setFormCategory('Lain-lain');
      setIsAddingCategory(false);
      setNewCategoryName('');
      loadData();
    } catch (err) {
      alert("Gagal tambah manual: " + err.message);
    }
  };

  const projectNumber = data.length > 0 ? data[0].task_unique_number : 'Project';
  
  const totalActual = data.reduce((sum, c) => sum + (c.actual_amount || 0), 0);

  const commitmentsCount = data.length;
  const filledCount = data.filter(d => d.status === 'Terisi' || d.status === 'Lunas' || d.status === 'Diteruskan').length;
  const forwardedCount = data.filter(d => d.status === 'Diteruskan' || d.status === 'Lunas').length;
  const isComplete = commitmentsCount > 0 && filledCount === commitmentsCount;
  const isAllForwarded = commitmentsCount > 0 && forwardedCount === commitmentsCount;
  
  const steps = [
    { title: 'Planning', status: 'Completed', desc: 'Rules Evaluated' },
    { title: 'Vendor Assigned', status: 'Completed', desc: 'Sourcing Done' },
    { title: 'Verification', status: filledCount > 0 ? (isComplete ? 'Completed' : 'Active') : 'Pending', desc: `${filledCount} of ${commitmentsCount} verified` },
    { title: 'Ready For Payment', status: isAllForwarded ? 'Completed' : (isComplete ? 'Active' : 'Pending'), desc: isAllForwarded ? 'Teruskan ke Pembayaran' : 'Ready to forward' }
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999,
      display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Invisible backdrop click area */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={closePanel} />
      
      {/* Side Panel */}
      <div 
        style={{
          width: '560px', backgroundColor: 'var(--color-canvas)', height: '100%',
          overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex', flexDirection: 'column', position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial Commitment</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--color-ink)', letterSpacing: '-0.5px' }}>{projectNumber}</h1>
              <span style={{ backgroundColor: isAllForwarded ? '#E0F2FE' : (isComplete ? '#DCFCE7' : '#FEF3C7'), color: isAllForwarded ? '#0369A1' : (isComplete ? '#166534' : '#92400E'), padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                {isAllForwarded ? 'Sudah Diteruskan' : (isComplete ? 'Ready for Payment' : 'Pending Verification')}
              </span>
            </div>
          </div>
          <button onClick={closePanel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-80)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>Memuat details...</div>
          ) : error ? (
            <div style={{ color: '#DC2626', backgroundColor: '#FEE2E2', padding: '16px', borderRadius: '12px' }}>{error}</div>
          ) : (
            <>
              {/* Financial Overview */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Financial Overview</h3>
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '16px', padding: '20px', border: '1px solid var(--color-hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', fontWeight: '600', marginBottom: '4px' }}>Total Tagihan</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-ink)' }}>{fmtRupiah(totalActual)}</div>
                    </div>
                    </div>
                </div>
              </div>

              {/* Commitment Details List */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Commitment Lines</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.map(c => {
                    const isFilled = c.status === 'Terisi' || c.status === 'Lunas' || c.status === 'Diteruskan';
                    const isInvoiced = c.status === 'Diteruskan';
                    const isSelected = selectedLedgers.includes(c.id);

                    return (
                      <div key={c.id} style={{ padding: '16px', backgroundColor: 'var(--color-canvas)', borderRadius: '12px', border: `1px solid ${isFilled ? '#DCFCE7' : 'var(--color-hairline)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                          <input 
                            type="checkbox" 
                            disabled={!isFilled || isInvoiced || (!c.invoice_no)}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedLedgers(prev => [...prev, c.id]);
                              else setSelectedLedgers(prev => prev.filter(id => id !== c.id));
                            }}
                            style={{ width: '18px', height: '18px', cursor: (!isFilled || isInvoiced) ? 'not-allowed' : 'pointer' }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{c.cost_category}</div>
                              {c.source === 'manual' && <span style={{ fontSize: '10px', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '8px' }}>Manual</span>}
                              {isInvoiced && <span style={{ fontSize: '10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '8px', fontWeight: '600' }}>Diteruskan</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>
                              {c.vendor_nama_manual || 'Vendor Unassigned'} {c.invoice_no ? `| Inv: ${c.invoice_no}` : ''}
                            </div>
                            {c.keterangan && <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginTop: '4px', fontStyle: 'italic' }}>{c.keterangan}</div>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', paddingRight: '16px', borderRight: '1px solid var(--color-hairline)', marginRight: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{fmtRupiah(c.actual_amount)}</div>
                        </div>
                        {isInvoiced ? (
                          <div style={{ padding: '8px', fontSize: '12px' }}>
                            <a href={`/workspace/payments?highlight=${c.job_order_id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}>
                              Lihat di Monitoring
                            </a>
                          </div>
                        ) : c.source === 'standard' && c.invoice_no ? (
                          <div style={{ padding: '8px', fontSize: '12px', fontWeight: '600', color: '#0EA5E9', backgroundColor: '#E0F2FE', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Synced from Ops
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setEditItem(c);
                              setFormVendor(c.vendor_nama_manual || '');
                              setFormInvoice(c.invoice_no || '');
                              setFormActual(c.actual_amount || '');
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', padding: '8px' }}
                          >
                            <Edit2 size={14} /> Verifikasi
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Add Manual Cost Button */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button 
                    onClick={() => setShowManualModal(true)}
                    style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1px dashed var(--color-ink-muted-48)', borderRadius: '12px', color: 'var(--color-ink-muted-80)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Plus size={16} /> Tambah Biaya Manual
                  </button>
                  <Button 
                    variant="primary" 
                    disabled={selectedLedgers.length === 0}
                    onClick={handlePushToPayment}
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Teruskan {selectedLedgers.length > 0 ? `(${selectedLedgers.length}) ` : ''}ke Monitoring Pembayaran →
                  </Button>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Lifecycle Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '15px', top: '20px', bottom: '20px', width: '2px', backgroundColor: 'var(--color-hairline)', zIndex: 0 }} />
                  {steps.map((step, idx) => {
                    const isCompleted = step.status === 'Completed';
                    const isActive = step.status === 'Active';
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1, paddingBottom: idx === steps.length - 1 ? 0 : '32px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isCompleted ? '#16A34A' : isActive ? '#3B82F6' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: isActive ? '4px solid #DBEAFE' : 'none' }}>
                          {isCompleted ? <CheckCircle size={16} color="white" /> : isActive ? <Activity size={14} color="white" /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-ink-muted-48)' }} />}
                        </div>
                        <div style={{ paddingTop: '4px' }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{step.title}</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: isActive ? '#3B82F6' : 'var(--color-ink-muted-80)' }}>{isActive ? 'Active' : step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal Edit/Verifikasi */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', width: '400px', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Verifikasi: {editItem.cost_category}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Vendor</label>
                <VendorSelect
                  value={formVendor}
                  onChange={val => setFormVendor(val)}
                  placeholder="Pilih / Ketik Nama Vendor"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>No. Invoice</label>
                <input value={formInvoice} onChange={e => setFormInvoice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-hairline)' }} placeholder="INV-2026..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Actual Amount (Rp)</label>
                <input type="number" value={formActual} onChange={e => setFormActual(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-hairline)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setEditItem(null)}>Batal</Button>
              <Button variant="primary" onClick={handleUpdateLine}>Simpan & Verifikasi</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Manual */}
      {showManualModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', width: '400px', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Tambah Biaya Manual</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Kategori Biaya</label>
                {!isAddingCategory ? (
                  <select 
                    value={formCategory} 
                    onChange={e => {
                      if (e.target.value === 'ADD_NEW') {
                        setIsAddingCategory(true);
                      } else {
                        setFormCategory(e.target.value);
                      }
                    }} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas)', outline: 'none' }}
                  >
                    {masterCategories.map(cat => (
                      <option key={cat.id} value={cat.nama_kategori}>{cat.nama_kategori}</option>
                    ))}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>+ Tambah Kategori Baru...</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      value={newCategoryName} 
                      onChange={e => setNewCategoryName(e.target.value)} 
                      placeholder="Nama kategori baru..." 
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--color-primary)', outline: 'none' }} 
                      autoFocus
                    />
                    <Button variant="primary" onClick={handleAddNewCategory} style={{ padding: '8px 12px' }}>Simpan</Button>
                    <Button variant="secondary" onClick={() => setIsAddingCategory(false)} style={{ padding: '8px 12px' }}>Batal</Button>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Keterangan</label>
                <input value={formKeterangan} onChange={e => setFormKeterangan(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-hairline)' }} placeholder="Demurrage / Storage..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Vendor</label>
                <VendorSelect
                  value={formVendor}
                  onChange={val => setFormVendor(val)}
                  placeholder="Pilih / Ketik Nama Vendor"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>No. Invoice</label>
                <input value={formInvoice} onChange={e => setFormInvoice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-hairline)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Actual Amount (Rp)</label>
                <input type="number" value={formActual} onChange={e => setFormActual(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-hairline)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowManualModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleAddManual}>Simpan Biaya</Button>
            </div>
          </div>
        </div>
      )}

      {/* Inject Keyframe animations globally for this component */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default FinancialRequestDetail;
