import React, { useState, useEffect } from 'react';
import { X, Star, Mail, Phone, MapPin, CheckCircle2, Plus } from 'lucide-react';
import useVendorStore from '../../../store/useVendorStore';
import useAuthStore from '../../../store/useAuthStore';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';

const VendorEvaluationForm = ({ vendorId, onClose }) => {
  const { addEvaluation } = useVendorStore();
  const [formData, setFormData] = useState({
    evaluation_period: '',
    service_quality_score: 5,
    on_time_score: 5,
    cost_score: 5,
    responsiveness_score: 5,
    compliance_score: 5,
    notes: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.evaluation_period) {
      setError('Periode evaluasi wajib diisi.');
      return;
    }
    try {
      await addEvaluation(vendorId, formData);
      onClose();
    } catch (e) {
      setError(e.message || 'Gagal menyimpan evaluasi');
    }
  };

  const inputSt = { width: '100%', padding: '8px', border: '1px solid var(--color-hairline)', borderRadius: '4px', fontSize: '13px' };
  const labelSt = { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' };

  return (
    <div style={{ padding: '16px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: '8px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '14px' }}>Form Evaluasi Baru</h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      
      {error && <div style={{ color: 'var(--color-status-danger)', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}

      <div style={{ display: 'grid', gap: '12px' }}>
        <div>
          <label style={labelSt}>Periode Evaluasi (contoh: Q1 2026)</label>
          <input type="text" name="evaluation_period" value={formData.evaluation_period} onChange={handleChange} style={inputSt} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelSt}>Service Quality (1-5)</label>
            <input type="number" min="1" max="5" step="0.1" name="service_quality_score" value={formData.service_quality_score} onChange={handleChange} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>On-Time Performance (1-5)</label>
            <input type="number" min="1" max="5" step="0.1" name="on_time_score" value={formData.on_time_score} onChange={handleChange} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Cost Competitiveness (1-5)</label>
            <input type="number" min="1" max="5" step="0.1" name="cost_score" value={formData.cost_score} onChange={handleChange} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Responsiveness (1-5)</label>
            <input type="number" min="1" max="5" step="0.1" name="responsiveness_score" value={formData.responsiveness_score} onChange={handleChange} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Compliance (1-5)</label>
            <input type="number" min="1" max="5" step="0.1" name="compliance_score" value={formData.compliance_score} onChange={handleChange} style={inputSt} />
          </div>
        </div>

        <div>
          <label style={labelSt}>Catatan</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} style={{ ...inputSt, resize: 'vertical', minHeight: '60px' }} />
        </div>

        <Button variant="primary" onClick={handleSubmit} style={{ width: '100%', justifyContent: 'center' }}>
          Simpan Evaluasi
        </Button>
      </div>
    </div>
  );
};

const VendorDetailPanel = ({ vendor, onClose, canEdit, onEdit }) => {
  const [activeTab, setActiveTab] = useState('Informasi');
  const [evaluations, setEvaluations] = useState([]);
  const [showEvalForm, setShowEvalForm] = useState(false);
  const { fetchEvaluations } = useVendorStore();
  const { user } = useAuthStore();
  
  const canEvaluate = user?.role === 'Manager' || user?.role === 'Supervisor';

  useEffect(() => {
    if (activeTab === 'Performa' || activeTab === 'Riwayat') {
      fetchEvaluations(vendor.id).then(setEvaluations).catch(console.error);
    }
  }, [vendor.id, activeTab, fetchEvaluations]);

  const rating = vendor.rating || 0;
  const reviewCount = vendor.review_count || 0;
  const isRated = reviewCount > 0;
  
  let classificationLabel = 'Belum Dinilai';
  if (isRated) {
    if (vendor.classification === 'EXCELLENT') classificationLabel = 'Sangat Baik';
    else if (vendor.classification === 'VERY_GOOD') classificationLabel = 'Baik Sekali';
    else if (vendor.classification === 'GOOD') classificationLabel = 'Baik';
    else if (vendor.classification === 'FAIR') classificationLabel = 'Cukup';
    else if (vendor.classification === 'POOR') classificationLabel = 'Kurang';
  }

  const tabs = ['Informasi', 'Performa', 'Riwayat'];
  const latestEval = evaluations.length > 0 ? evaluations[0] : null;

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
            {vendor.service_type === 'Trucking' ? '🚛' : vendor.service_type === 'Forwarder' ? '🚢' : '🚢🚛'}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 4px 0' }}>{vendor.nama}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Badge type="priority" value={vendor.service_type === 'Trucking' ? 'Sedang' : 'Tinggi'} labelOverride={vendor.service_type} />
              
              {isRated ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>
                  <Star size={14} color="#ff9500" fill="#ff9500" />
                  {rating.toFixed(2)} <span style={{ color: 'var(--color-ink-muted-48)', fontWeight: '400' }}>({reviewCount})</span>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Belum Dinilai</span>
              )}
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
                {(Array.isArray(vendor.layanan) ? vendor.layanan : []).map((l, i) => (
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
            
            {!showEvalForm && canEvaluate && (
              <Button variant="secondary" onClick={() => setShowEvalForm(true)} style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={16} style={{ marginRight: '8px' }} /> Evaluasi Baru
              </Button>
            )}

            {showEvalForm && (
              <VendorEvaluationForm vendorId={vendor.id} onClose={() => { setShowEvalForm(false); fetchEvaluations(vendor.id).then(setEvaluations); }} />
            )}

            {!isRated && !latestEval ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-ink-muted-48)' }}>
                Belum ada data performa untuk vendor ini.
              </div>
            ) : (
              <>
                <div style={{ padding: '20px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'var(--shadow-product)' }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-ink-muted-80)', fontWeight: '600' }}>Skor Keseluruhan</div>
                  <div style={{ fontSize: '42px', fontWeight: '700', color: rating >= 4.0 ? 'var(--color-status-success)' : rating >= 3.0 ? 'var(--color-status-warning)' : 'var(--color-status-danger)', margin: '8px 0' }}>
                    {rating.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{classificationLabel}</div>
                </div>

                {latestEval && (
                  <div>
                    <h4 style={{ fontSize: '13px', margin: '0 0 12px 0', color: 'var(--color-ink)' }}>Detail Evaluasi Terakhir ({latestEval.evaluation_period})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { label: 'Service Quality (25%)', val: latestEval.service_quality_score },
                        { label: 'On-Time Performance (25%)', val: latestEval.on_time_score },
                        { label: 'Cost Competitiveness (20%)', val: latestEval.cost_score },
                        { label: 'Responsiveness (15%)', val: latestEval.responsiveness_score },
                        { label: 'Compliance (15%)', val: latestEval.compliance_score }
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: '4px', border: '1px solid var(--color-hairline)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>{item.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{item.val.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'Riwayat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {evaluations.length > 0 ? evaluations.map(ev => (
              <div key={ev.id} style={{ padding: '12px', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--color-canvas)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{ev.evaluation_period}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>{ev.overall_score.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)', marginBottom: '8px' }}>
                  Klasifikasi: {ev.classification}
                </div>
                {ev.notes && (
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', fontStyle: 'italic', padding: '8px', backgroundColor: 'var(--color-canvas-parchment)', borderRadius: '4px' }}>
                    "{ev.notes}"
                  </div>
                )}
                <div style={{ fontSize: '10px', color: 'var(--color-ink-muted-48)', marginTop: '8px', textAlign: 'right' }}>
                  Dievaluasi pada: {new Date(ev.created_at).toLocaleDateString('id-ID')}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-ink-muted-48)', fontSize: '13px' }}>
                Belum ada riwayat evaluasi.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default VendorDetailPanel;
