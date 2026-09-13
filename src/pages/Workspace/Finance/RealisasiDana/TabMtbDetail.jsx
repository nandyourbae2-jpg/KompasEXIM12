import React, { useEffect, useState } from 'react';
import useMtbStore from '../../../../store/useMtbStore';
import useAuthStore from '../../../../store/useAuthStore';
import { ArrowLeft, CheckCircle2, Download, Plus, AlertCircle } from 'lucide-react';
import Button from '../../../../components/Button';
import * as XLSX from 'xlsx';
import api from '../../../../lib/api';

const formatMoney = (amount) => `IDR ${amount.toLocaleString('id-ID')}`;

const STATUS_STEPS = [
  { id: 'Prepared', label: 'Prepared', status: 'Submitted', role: 'Staff Dept', field: 'prepared_by_id', dateField: 'prepared_at' },
  { id: 'Checked1', label: 'Checked', status: 'Checked1', role: 'Supervisor', field: 'checked1_by_id', dateField: 'checked1_at' },
  { id: 'Approved', label: 'Approved', status: 'Approved', role: 'Manager', field: 'approved_by_id', dateField: 'approved_at' }
];

const TabMtbDetail = ({ periodeId, onBack }) => {
  const { periodes, transaksi, fetchTransaksi, createTransaksi, updateTransaksi, updatePeriodeStatus, deleteTransaksi } = useMtbStore();
  const { user, allUsers, fetchAllUsers } = useAuthStore();
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editTxId, setEditTxId] = useState(null);
  const [newTx, setNewTx] = useState({
    tgl_payment: '', unique_number: '', category: 'DO MAERSK', shipment: '', party: '',
    invoice_shipment: '', bl_number: '', no_kwitansi: '', amount_exclude_tax: 0, vat: 0,
    pot_pph23_diskon: 0, materai_adm: 0, adm_bank: 0, debet: 0, expense_gp: ''
  });

  const periode = periodes.find(p => p.id === periodeId);

  const [availableJobOrders, setAvailableJobOrders] = useState([]);
  
  useEffect(() => {
    fetchTransaksi(periodeId);
    if (allUsers.length === 0) fetchAllUsers();
    
    // Fetch Job Orders available for MTB
    const fetchJobOrders = async () => {
      try {
        const data = await api(`/job-orders/available-for-mtb?periode_id=${periodeId}`);
        setAvailableJobOrders(data || []);
      } catch (err) {
        console.error('Failed to fetch job orders', err);
      }
    };
    fetchJobOrders();
  }, [periodeId, fetchTransaksi, allUsers.length, fetchAllUsers]);

  if (!periode) return <div>Loading...</div>;

  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.status === periode.status) + 1; // if Draft, index 0
  const isDraft = periode.status === 'Draft';
  const canEditTx = periode.status !== 'Approved';
  
  // Role checks for approval buttons
  const isStaff = user?.level_otoritas === 'Staff Dept';
  const isSpv = user?.level_otoritas === 'Supervisor';
  const isManager = user?.level_otoritas === 'Manager';

  const canSubmit = isDraft && isStaff && periode.prepared_by_id === user?.id;
  const canCheck1 = periode.status === 'Submitted' && isSpv;
  const canApprove = (periode.status === 'Submitted' || periode.status === 'Checked1') && isManager;

  const handleAction = async (newStatus) => {
    try {
      await updatePeriodeStatus(periodeId, { status: newStatus, version: periode.version });
    } catch (e) {
      alert('Error updating status: ' + e.message);
    }
  };

  const handleSaveTx = async () => {
    try {
      const payload = {
        periode_id: periodeId,
        ...newTx,
        amount_exclude_tax: Number(newTx.amount_exclude_tax),
        vat: Number(newTx.vat),
        pot_pph23_diskon: Number(newTx.pot_pph23_diskon),
        materai_adm: Number(newTx.materai_adm),
        adm_bank: Number(newTx.adm_bank),
        debet: Number(newTx.debet),
        transaction_source: newTx.job_order_id ? 'PAYMENT_SETTLEMENT' : 'MANUAL',
        version: newTx.version
      };
      
      if (editTxId) {
        await updateTransaksi(editTxId, payload);
      } else {
        await createTransaksi(payload);
      }
      
      setIsTxModalOpen(false);
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const openAddModal = () => {
    setEditTxId(null);
    setNewTx({
      tgl_payment: '', unique_number: '', category: 'DO MAERSK', shipment: '', party: '',
      invoice_shipment: '', bl_number: '', no_kwitansi: '', amount_exclude_tax: 0, vat: 0,
      pot_pph23_diskon: 0, materai_adm: 0, adm_bank: 0, debet: 0, expense_gp: '', job_order_id: '', version: 1
    });
    setIsTxModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditTxId(tx.id);
    setNewTx({
      tgl_payment: tx.tgl_payment || '', unique_number: tx.unique_number || '', category: tx.category || 'DO MAERSK', shipment: tx.shipment || '', party: tx.party || '',
      invoice_shipment: tx.invoice_shipment || '', bl_number: tx.bl_number || '', no_kwitansi: tx.no_kwitansi || '', amount_exclude_tax: tx.amount_exclude_tax || 0, vat: tx.vat || 0,
      pot_pph23_diskon: tx.pot_pph23_diskon || 0, materai_adm: tx.materai_adm || 0, adm_bank: tx.adm_bank || 0, debet: tx.debet || 0, expense_gp: tx.expense_gp || '', job_order_id: tx.job_order_id || '', version: tx.version || 1
    });
    setIsTxModalOpen(true);
  };

  const handleJobOrderSelect = (e) => {
    const joId = e.target.value;
    if (!joId) {
      setNewTx({ ...newTx, job_order_id: '' });
      return;
    }
    const jo = availableJobOrders.find(j => j.id.toString() === joId);
    if (jo) {
      setNewTx({
        ...newTx,
        job_order_id: jo.id,
        category: jo.cost_type || 'LAINNYA',
        amount_exclude_tax: jo.dpp || 0,
        vat: jo.ppn || 0,
        shipment: jo.shipment?.un || '',
        invoice_shipment: jo.invoice_no || '',
        unique_number: jo.shipment?.un || ''
      });
    }
  };

  const handleExport = () => {
    const wsData = [
      ['REALISASI BIAYA OPERASIONAL EXIM'],
      [`Periode: ${periode.nama_periode}`],
      [],
      ['No', 'Tgl Payment', 'UN', 'Category', 'Shipment', 'Party', 'Invoice', 'BL', 'No. Kwitansi', 'DPP', 'VAT', 'Pot PPH23/Diskon', 'Materai/ADM', 'ADM Bank', 'Kredit', 'Debet', 'Saldo', 'GP Ref'],
      ...transaksi.map((tx, i) => [
        i + 1, tx.tgl_payment, tx.unique_number, tx.category, tx.shipment, tx.party, tx.invoice_shipment,
        tx.bl_number, tx.no_kwitansi, tx.amount_exclude_tax, tx.vat, tx.pot_pph23_diskon, tx.materai_adm,
        tx.adm_bank, tx.kredit, tx.debet, tx.saldo_running, tx.expense_gp
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MTB Detail");
    XLSX.writeFile(wb, `MTB_${periode.nama_periode.replace(/ /g,'_')}.xlsx`);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-family-body)' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--color-ink-muted)', cursor: 'pointer', marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Kembali
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>Buku Kas MTB: {periode.nama_periode}</h1>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--color-ink-muted)' }}>
            <div><strong>Saldo Awal:</strong> {formatMoney(periode.saldo_awal)}</div>
            <div><strong>Total Kredit:</strong> <span style={{ color: '#DC2626' }}>{formatMoney(periode.total_kredit || 0)}</span></div>
            <div><strong>Total Debet:</strong> <span style={{ color: '#16A34A' }}>{formatMoney(periode.total_debet || 0)}</span></div>
            <div><strong>Saldo Akhir:</strong> <span style={{ color: 'var(--color-ink)', fontWeight: 'bold' }}>{formatMoney(periode.saldo_akhir || periode.saldo_awal)}</span></div>
          </div>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <Download size={16} /> Export Excel
        </Button>
      </div>

      <div style={{ backgroundColor: 'var(--color-canvas)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-hairline)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', marginTop: 0, marginBottom: '20px' }}>Status Persetujuan</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', backgroundColor: 'var(--color-hairline)', zIndex: 1 }} />
          
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = currentStatusIndex > idx;
            const userAction = allUsers.find(u => u.id === periode[step.field]);
            const actionDate = periode[step.dateField];

            return (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, width: '20%' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isCompleted ? '#16A34A' : 'var(--color-canvas)',
                  border: isCompleted ? 'none' : '2px solid var(--color-hairline)',
                  color: isCompleted ? 'white' : 'var(--color-ink-muted)',
                  marginBottom: '8px'
                }}>
                  {isCompleted ? <CheckCircle2 size={16} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-hairline)' }} />}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: isCompleted ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}>
                  {step.label}
                </div>
                {userAction ? (
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)', textAlign: 'center', marginTop: '4px' }}>
                    {userAction.nama}<br/>
                    {actionDate ? new Date(actionDate).toLocaleDateString('id-ID') : ''}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '4px' }}>
                    {step.role}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {canSubmit && <Button variant="primary" onClick={() => handleAction('Submitted')}>Ajukan (Submit)</Button>}
          {canCheck1 && <Button variant="primary" onClick={() => handleAction('Checked1')}>Tandai Checked (SPV)</Button>}
          {canApprove && <Button variant="primary" onClick={() => handleAction('Approved')}>Approve Final (Manager)</Button>}
          {(canCheck1 || canApprove) && <Button variant="secondary" onClick={() => handleAction('Draft')} style={{ color: '#DC2626' }}>Tolak ke Draft</Button>}
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: '12px', border: '1px solid var(--color-hairline)' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-hairline)' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Mutasi Kas</h3>
          {canEditTx && (
            <Button variant="primary" onClick={openAddModal}>
              <Plus size={16} /> Tambah Mutasi
            </Button>
          )}
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-canvas-parchment)', textAlign: 'left', borderBottom: '1px solid var(--color-hairline)' }}>
                <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Tgl Payment</th>
                <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>UN / Category</th>
                <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Keterangan</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>DPP</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>VAT</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Pot/ADM</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', backgroundColor: '#FEE2E2', color: '#B91C1C' }}>Kredit (Keluar)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', backgroundColor: '#DCFCE7', color: '#15803D' }}>Debet (Masuk)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold' }}>Saldo Running</th>
                {canEditTx && <th style={{ padding: '10px 12px' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {transaksi.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>Belum ada mutasi</td></tr>
              ) : (
                transaksi.map((tx) => {
                  const isDebet = tx.debet > 0;
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: isDebet ? '#F0FDF4' : 'transparent' }}>
                      <td style={{ padding: '10px 12px' }}>{tx.tgl_payment}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: '600' }}>{tx.category}</div>
                        {tx.unique_number && <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>{tx.unique_number}</div>}
                        <div style={{ marginTop: '4px' }}>
                          {tx.job_order_id ? (
                            <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#DCFCE7', color: '#166534', borderRadius: '4px', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={10} /> Sync
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '4px', border: '1px solid #E2E8F0' }}>Manual Adjustment</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {tx.shipment} {tx.party ? `(${tx.party})` : ''}
                        {tx.invoice_shipment && <div>Inv: {tx.invoice_shipment}</div>}
                        {tx.jo_sumber && <div style={{ fontSize: '10px', color: '#2563EB', marginTop: '2px' }}>Src: {tx.jo_sumber}</div>}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{tx.amount_exclude_tax?.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{tx.vat?.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div>Pot: {tx.pot_pph23_diskon?.toLocaleString('id-ID')}</div>
                        <div>Adm: {(tx.materai_adm + tx.adm_bank)?.toLocaleString('id-ID')}</div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#B91C1C', fontWeight: '600' }}>{tx.kredit?.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#15803D', fontWeight: '600' }}>{tx.debet?.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold' }}>{tx.saldo_running?.toLocaleString('id-ID')}</td>
                      {canEditTx && (
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEditModal(tx)} style={{ color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}>Edit</button>
                            <button onClick={() => deleteTransaksi(tx.id, periodeId)} style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}>Hapus</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isTxModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', width: '600px', borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>{editTxId ? 'Edit Mutasi' : 'Tambah Mutasi (Kredit/Debet)'}</h3>
            
            {(() => {
              const isEditMode = !!editTxId;
              const isManualAdjustment = isEditMode && !newTx.job_order_id;
              
              const currentTx = isEditMode ? transaksi.find(t => t.id === editTxId) : null;
              
              const selectedJO = isEditMode && currentTx?.job_order_id ? {
                  id: currentTx.job_order_id,
                  job_order_no: currentTx.job_order_code,
                  shipment_un: currentTx.jo_shipment?.un,
                  vendor_name: currentTx.vendor_name,
                  invoice_no: currentTx.jo_invoice_no,
                  total_invoice: currentTx.total_invoice,
                  payment_status: currentTx.status_linked,
                  sumber: currentTx.jo_sumber
              } : availableJobOrders.find(j => j.id.toString() === (newTx.job_order_id || '').toString());
              
              const readOnlyStyle = { 
                width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px',
                backgroundColor: newTx.job_order_id ? '#F3F4F6' : 'white',
                color: newTx.job_order_id ? '#6B7280' : 'inherit',
                cursor: newTx.job_order_id ? 'not-allowed' : 'text'
              };

              return (
                <>
            {!isEditMode && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Pilih Job Order (Auto-fill)</label>
                <select onChange={handleJobOrderSelect} value={newTx.job_order_id || ''} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }}>
                  <option value="">-- Pilih Job Order --</option>
                  {availableJobOrders.map(jo => {
                    return (
                      <option key={jo.id} value={jo.id}>{jo.job_order_no} - {jo.shipment?.un} - {jo.vendor_name}</option>
                    )
                  })}
                </select>
              </div>
            )}
            
            {isManualAdjustment && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '8px', border: '1px solid #D1D5DB' }}>
                <strong style={{ color: '#4B5563', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={16} /> Manual Adjustment (Unlinked)
                </strong>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Transaksi ini dibuat tanpa sinkronisasi ke Financial Payment Tracker.</div>
              </div>
            )}

            {selectedJO && (
              <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="#16A34A" /> Synchronized {isEditMode && <span style={{fontSize: '11px', color: '#64748B', fontWeight: 'normal'}}>(Immutable Linkage)</span>}
                  </h4>
                  <span style={{ fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '12px', backgroundColor: selectedJO.payment_status === 'PAID' ? '#DCFCE7' : '#FEF9C3', color: selectedJO.payment_status === 'PAID' ? '#166534' : '#854D0E' }}>
                    {selectedJO.payment_status || 'PENDING'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                  <div><span style={{ color: 'var(--color-ink-muted)' }}>Source:</span> <strong>Financial Payment Tracker</strong></div>
                  <div><span style={{ color: 'var(--color-ink-muted)' }}>Vendor:</span> {selectedJO.vendor_name || '-'}</div>
                  <div><span style={{ color: 'var(--color-ink-muted)' }}>Invoice No:</span> {selectedJO.invoice_no || '-'}</div>
                  <div><span style={{ color: 'var(--color-ink-muted)' }}>Total Tagihan:</span> {formatMoney(selectedJO.total_invoice)}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#EFF6FF', borderRadius: '6px', fontSize: '12px', color: '#1E3A8A', border: '1px solid #BFDBFE' }}>
                  <strong>Informasi:</strong> Field kategori, referensi, dan DPP/VAT telah ditarik otomatis dari Job Order dan dikunci (Read-Only) untuk menjaga integritas data (Single Source of Truth).
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Tgl Payment*</label>
                <input type="date" value={newTx.tgl_payment} onChange={e => setNewTx({...newTx, tgl_payment: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Kategori*</label>
                <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} disabled={!!newTx.job_order_id} style={{ ...readOnlyStyle, cursor: newTx.job_order_id ? 'not-allowed' : 'pointer' }}>
                  <option value="DO MAERSK">DO MAERSK</option>
                  <option value="PORT NPCT">PORT NPCT</option>
                  <option value="TRUCKING">TRUCKING</option>
                  <option value="CB SINAR">CB SINAR</option>
                  <option value="INS BOSOWA">INS BOSOWA</option>
                  <option value="PNBP KKP">PNBP KKP</option>
                  <option value="LAINNYA">LAINNYA</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Unique Number (IMP-XXX)</label>
                <input type="text" value={newTx.unique_number} readOnly={!!newTx.job_order_id} onChange={e => setNewTx({...newTx, unique_number: e.target.value})} style={readOnlyStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Shipment</label>
                <input type="text" value={newTx.shipment} readOnly={!!newTx.job_order_id} onChange={e => setNewTx({...newTx, shipment: e.target.value})} style={readOnlyStyle} />
              </div>
            </div>

            <h4 style={{ margin: '16px 0 8px 0', fontSize: '13px', color: 'var(--color-ink-muted)' }}>Nominal (Kredit)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>DPP (Amount Exc Tax)</label>
                <input type="number" value={newTx.amount_exclude_tax} readOnly={!!newTx.job_order_id} onChange={e => setNewTx({...newTx, amount_exclude_tax: e.target.value})} style={readOnlyStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>VAT (PPN)</label>
                <input type="number" value={newTx.vat} readOnly={!!newTx.job_order_id} onChange={e => setNewTx({...newTx, vat: e.target.value})} style={readOnlyStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Potongan / PPH23</label>
                <input type="number" value={newTx.pot_pph23_diskon} onChange={e => setNewTx({...newTx, pot_pph23_diskon: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Materai / ADM Bank</label>
                <input type="number" value={newTx.materai_adm} onChange={e => setNewTx({...newTx, materai_adm: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} />
              </div>
            </div>

            <h4 style={{ margin: '16px 0 8px 0', fontSize: '13px', color: '#15803D' }}>Atau Nominal (Debet / Dana Masuk)</h4>
            <div style={{ marginBottom: '24px' }}>
              <input type="number" value={newTx.debet} onChange={e => setNewTx({...newTx, debet: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--color-hairline)', borderRadius: '4px' }} placeholder="Isi jika ini adalah dana kembali dari Finance" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" onClick={() => setIsTxModalOpen(false)}>Batal</Button>
              <Button variant="primary" onClick={handleSaveTx} disabled={!newTx.tgl_payment}>
                {editTxId ? 'Simpan Perubahan' : 'Simpan Transaksi'}
              </Button>
            </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TabMtbDetail;
