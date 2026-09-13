import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePibRequestStore from '../../../store/usePibRequestStore';
import useImportProjectStore from '../../../store/useImportProjectStore';
import { Plus, Search, FileText, ChevronRight, X, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import { fmtRupiahSigned } from '../../../utils/importCalc';
import { useFormSubmit } from '../../../hooks/useFormSubmit';

const StatusBadge = ({ status }) => {
  const styles = {
    'Draft': { bg: 'var(--color-divider-soft)', text: 'var(--color-ink-muted-80)', icon: <FileText size={12} /> },
    'Submitted': { bg: 'var(--color-status-warning-bg)', text: 'var(--color-status-warning)', icon: <Clock size={12} /> },
    'Approved': { bg: 'var(--color-status-info-bg)', text: 'var(--color-status-info)', icon: <CheckCircle size={12} /> },
    'Realized': { bg: '#e0e7ff', text: '#4338ca', icon: <CheckCircle size={12} /> },
    'Rejected': { bg: 'var(--color-status-danger-bg)', text: 'var(--color-status-danger)', icon: <XCircle size={12} /> },
    'Settled': { bg: 'var(--color-status-success-bg)', text: 'var(--color-status-success)', icon: <CheckCircle size={12} /> },
  };

  const style = styles[status] || styles['Draft'];
  
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 8px', borderRadius: 'var(--rounded-sm)',
      fontSize: '12px', fontWeight: '500',
      backgroundColor: style.bg, color: style.text
    }}>
      {style.icon}
      {status}
    </span>
  );
};

const PibRequestList = () => {
  const { requests, summary, fetchRequests, fetchSummary, createRequest, isLoading } = usePibRequestStore();
  const { importProjects, fetchImportProjects } = useImportProjectStore();
  const navigate = useNavigate();

  const [filterStatus, setFilterStatus] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (val) => {
    if (!val) return '';
    const num = String(val).replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const [form, setForm] = useState({
    import_project_id: '',
    shipment_id: '',
    aju_pib: '',
    tanggal_pengajuan: new Date().toISOString().slice(0, 10),
    estimasi_bm: '',
    estimasi_ppn: '',
    estimasi_pph: '',
    kasbon_diminta: '',
    no_invoice_pib: '',
    bl_number: '',
    keterangan: ''
  });

  const [projectShipments, setProjectShipments] = useState([]);

  useEffect(() => {
    fetchRequests({ status: filterStatus, bulan: filterBulan });
    fetchSummary();
  }, [filterStatus, filterBulan, fetchRequests, fetchSummary]);

  useEffect(() => {
    fetchImportProjects();
  }, [fetchImportProjects]);

  useEffect(() => {
    if (form.import_project_id) {
      api(`/import-shipments?import_project_id=${form.import_project_id}&limit=100`)
        .then(res => {
          const rows = Array.isArray(res) ? res : (res.data || []);
          setProjectShipments(rows);
        })
        .catch(console.error);
    } else {
      setProjectShipments([]);
    }
  }, [form.import_project_id]);

  const { handleSubmit: submitHandler, loading: submitting, error, fieldErrors, setFieldErrors } = useFormSubmit(
    async () => {
      if (!form.import_project_id || !form.estimasi_bm || !form.estimasi_ppn || !form.estimasi_pph) {
        setFieldErrors({
          import_project_id: !form.import_project_id ? 'Wajib' : null,
          estimasi_bm: !form.estimasi_bm ? 'Wajib' : null,
          estimasi_ppn: !form.estimasi_ppn ? 'Wajib' : null,
          estimasi_pph: !form.estimasi_pph ? 'Wajib' : null,
        });
        throw new Error('Mohon lengkapi field wajib');
      }

      const payload = {
        ...form,
        estimasi_bm: parseFloat(form.estimasi_bm) || 0,
        estimasi_ppn: parseFloat(form.estimasi_ppn) || 0,
        estimasi_pph: parseFloat(form.estimasi_pph) || 0,
        kasbon_diminta: parseFloat(form.kasbon_diminta) || 0
      };
      await createRequest(payload);
      setIsModalOpen(false);
      fetchRequests({ status: filterStatus, bulan: filterBulan });
      fetchSummary();
    }
  );

  const handleSubmitForm = (e) => {
    e.preventDefault();
    submitHandler();
  };

  const estTotalForm = (parseFloat(form.estimasi_bm)||0) + (parseFloat(form.estimasi_ppn)||0) + (parseFloat(form.estimasi_pph)||0);

  const kpiSt = {
    backgroundColor: 'var(--color-canvas)',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-lg)',
    padding: '24px',
    flex: '1',
    display: 'flex', flexDirection: 'column', gap: '8px'
  };

  const btnSt = {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    padding: '11px 22px',
    borderRadius: 'var(--rounded-pill)',
    border: 'none',
    fontSize: '14px', fontWeight: '500',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px'
  };

  const inputSt = {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-sm)',
    fontSize: '14px', fontFamily: 'var(--font-family-body)',
    outline: 'none', backgroundColor: 'var(--color-canvas)',
    color: 'var(--color-ink)', boxSizing: 'border-box',
    marginTop: '4px'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)', fontFamily: 'var(--font-family-body)' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px 20px', backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 4px 0', letterSpacing: '-0.374px' }}>PIB Request</h1>
            <p style={{ color: 'var(--color-ink-muted-48)', fontSize: '14px', margin: 0 }}>Kelola permohonan pembayaran PIB (Pemberitahuan Impor Barang)</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} style={btnSt}>
            <Plus size={16} /> Buat PIB Request
          </button>
        </div>

        {/* KPI Cards */}
        {summary && (
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={kpiSt}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-muted-80)' }}>
                <div style={{ padding: '6px', backgroundColor: 'var(--color-divider-soft)', color: 'var(--color-ink-muted-80)', borderRadius: '8px' }}><FileText size={16} /></div>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Draft Request</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-ink)' }}>{summary.draftCount}</div>
            </div>
            
            <div style={kpiSt}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-muted-80)' }}>
                <div style={{ padding: '6px', backgroundColor: 'var(--color-status-warning-bg)', color: 'var(--color-status-warning)', borderRadius: '8px' }}><Clock size={16} /></div>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Menunggu Approval</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-ink)' }}>{summary.pendingCount}</div>
            </div>

            <div style={kpiSt}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-muted-80)' }}>
                <div style={{ padding: '6px', backgroundColor: 'var(--color-status-info-bg)', color: 'var(--color-status-info)', borderRadius: '8px' }}><CheckCircle size={16} /></div>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Approved Bulan Ini</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-ink)' }}>{summary.approvedThisMonth}</div>
            </div>

            <div style={kpiSt}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-muted-80)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Kasbon Pending</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-ink)' }}>{fmtRupiahSigned(summary.pendingTotalKasbon)}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {/* Table Section */}
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-hairline)' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px', border: '1px solid var(--color-hairline)', borderRadius: '6px' }}>
              <option value="">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Realized">Realized</option>
              <option value="Settled">Settled</option>
            </select>
            <input type="month" value={filterBulan} onChange={e => setFilterBulan(e.target.value)} style={{ padding: '8px', border: '1px solid var(--color-hairline)', borderRadius: '6px' }} />
          </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>No. Request / AJU</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>Import Project</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textAlign: 'right' }}>Est. Total PIB</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textAlign: 'right' }}>Kasbon Diminta</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>Tanggal</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-ink-muted-80)', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Memuat data...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>Belum ada data PIB Request</td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--color-ink)' }}>{req.request_number}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)' }}>AJU: {req.aju_pib}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: 'var(--color-primary)' }}>{req.import_project_number}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-ink)' }}>
                    {fmtRupiahSigned(req.estimasi_total)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: 'var(--color-ink)' }}>
                    {fmtRupiahSigned(req.kasbon_diminta)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <StatusBadge status={req.status} />
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-ink-muted-80)' }}>
                    {req.tanggal_pengajuan}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button 
                      onClick={() => navigate(`/workspace/pib-request/${req.id}`)}
                      style={{ 
                        padding: '6px 12px', backgroundColor: 'var(--color-surface-pearl)', 
                        border: '1px solid var(--color-divider-soft)', borderRadius: 'var(--rounded-md)', 
                        color: 'var(--color-ink)', cursor: 'pointer', fontSize: '12px', fontWeight: '500' 
                      }}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Buat Request */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'var(--color-canvas)', zIndex: 10 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)', margin: 0 }}>Buat PIB Request</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-48)' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmitForm} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                <div style={{
                  backgroundColor: '#fff1f1',
                  color: '#d32f2f',
                  padding: '12px',
                  borderRadius: 'var(--rounded-sm)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>Import Project *</label>
                  <select required style={inputSt} value={form.import_project_id} onChange={(e) => setForm({...form, import_project_id: e.target.value, shipment_id: ''})}>
                    <option value="">Pilih Project...</option>
                    {importProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.taskUniqueNumber || p.id} - {p.supplier}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>Shipment (Opsional) - {projectShipments.length} tersedia</label>
                  <select style={inputSt} value={form.shipment_id} onChange={(e) => {
                    const sId = e.target.value;
                    const s = projectShipments.find(sh => String(sh.id) === String(sId));
                    setForm({
                      ...form, 
                      shipment_id: sId,
                      import_project_id: s?.import_project_id || s?.importProjectId || form.import_project_id,
                      bl_number: s?.bl_no || s?.blSwbAwb || ''
                    });
                  }} disabled={projectShipments.length === 0}>
                    <option value="">{projectShipments.length > 0 ? 'Pilih Shipment...' : 'Tidak ada shipment'}</option>
                    {projectShipments.map(s => (
                      <option key={s.id} value={s.id}>{s.un || `Shipment ${s.id}`} - {s.supplier}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>Nomor AJU PIB *</label>
                  <input required type="text" style={inputSt} placeholder="2026..." value={form.aju_pib} onChange={e => setForm({...form, aju_pib: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>Tanggal Pengajuan *</label>
                  <input required type="date" style={inputSt} value={form.tanggal_pengajuan} onChange={e => setForm({...form, tanggal_pengajuan: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>No. Invoice PIB (Billing Bea Cukai)</label>
                  <input type="text" style={inputSt} placeholder="Ketik No. Invoice PIB..." value={form.no_invoice_pib} onChange={e => setForm({...form, no_invoice_pib: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>BL Number (Opsional)</label>
                  <input type="text" style={inputSt} placeholder="Otomatis terisi jika ada..." value={form.bl_number} onChange={e => setForm({...form, bl_number: e.target.value})} />
                </div>
              </div>

              <div style={{ border: '1px solid var(--color-hairline)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-canvas-parchment)', borderBottom: '1px solid var(--color-hairline)', fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>Estimasi Biaya PIB</div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>Est. Bea Masuk <span style={{ color: 'var(--color-status-danger)' }}>*</span></label>
                      <input type="text" value={formatCurrency(form.estimasi_bm)} onChange={e => setForm({...form, estimasi_bm: e.target.value.replace(/\D/g, '')})} style={{ width: '100%', padding: '10px 14px', border: fieldErrors.estimasi_bm ? '1px solid var(--color-status-danger)' : '1px solid var(--color-divider-soft)', borderRadius: 'var(--rounded-md)', boxSizing: 'border-box' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>Est. PPN Impor <span style={{ color: 'var(--color-status-danger)' }}>*</span></label>
                      <input type="text" value={formatCurrency(form.estimasi_ppn)} onChange={e => setForm({...form, estimasi_ppn: e.target.value.replace(/\D/g, '')})} style={{ width: '100%', padding: '10px 14px', border: fieldErrors.estimasi_ppn ? '1px solid var(--color-status-danger)' : '1px solid var(--color-divider-soft)', borderRadius: 'var(--rounded-md)', boxSizing: 'border-box' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-ink-muted-80)' }}>Est. PPH Ps 22 <span style={{ color: 'var(--color-status-danger)' }}>*</span></label>
                      <input type="text" value={formatCurrency(form.estimasi_pph)} onChange={e => setForm({...form, estimasi_pph: e.target.value.replace(/\D/g, '')})} style={{ width: '100%', padding: '10px 14px', border: fieldErrors.estimasi_pph ? '1px solid var(--color-status-danger)' : '1px solid var(--color-divider-soft)', borderRadius: 'var(--rounded-md)', boxSizing: 'border-box' }} required />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px dashed var(--color-divider-soft)' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>Total Estimasi PIB</span>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)' }}>{fmtRupiahSigned(estTotalForm)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>Kasbon Diminta ke Finance *</label>
                <input required type="text" style={{ ...inputSt, fontSize: '16px', fontWeight: '600' }} placeholder="Rp ..." value={formatCurrency(form.kasbon_diminta)} onChange={e => setForm({...form, kasbon_diminta: e.target.value.replace(/\D/g, '')})} />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink-muted-80)' }}>Keterangan (Opsional)</label>
                <textarea rows="2" style={inputSt} value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', border: '1px solid var(--color-divider-soft)', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', borderRadius: 'var(--rounded-pill)', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={submitting} style={{ ...btnSt, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>{submitting ? 'Menyimpan...' : 'Buat Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default PibRequestList;
