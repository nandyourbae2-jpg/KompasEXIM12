import React, { useState, useEffect } from 'react';
import usePaymentStore from '../../../store/usePaymentStore';
import useAuthStore from '../../../store/useAuthStore';
import { canWritePayment } from '../../../utils/authHelpers';
import { Plus, Search, Paperclip, ChevronRight, Link as LinkIcon, Download, DollarSign, Activity, FileText, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import AddInvoiceModal from './AddInvoiceModal';
import UpdatePaymentModal from './UpdatePaymentModal';
import PaymentHistoryModal from './PaymentHistoryModal';
import api from '../../../lib/api';
import DeleteConfirmModal from './DeleteConfirmModal';
import AssignToMtbModal from './AssignToMtbModal';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';
import { useAppleModal } from '../../../contexts/AppleModalContext';

const PaymentDashboard = () => {
  const { jobOrders, getKpiStats, fetchJobOrders, deleteJobOrder } = usePaymentStore();
  const { user } = useAuthStore();
  const { alert } = useAppleModal();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [updateJoId, setUpdateJoId] = useState(null);
  const [historyJoId, setHistoryJoId] = useState(null);
  const [deleteJoId, setDeleteJoId] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedJoIds, setSelectedJoIds] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  useEffect(() => {
    fetchJobOrders();
    // Fetch available months dynamically
    api('/job-orders/available-months')
      .then(data => setAvailableMonths(data || []))
      .catch(err => console.error(err));
  }, [fetchJobOrders]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCostType, setFilterCostType] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterBulan, setFilterBulan] = useState('');

  const namaBulan = ['Januari','Februari','Maret','April','Mei','Juni',
                     'Juli','Agustus','September','Oktober','November','Desember'];

  const formatMoney = (amount, currency) => {
    if (currency === 'USD') return `$ ${amount.toLocaleString('en-US')}`;
    return `IDR ${amount.toLocaleString('id-ID')}`;
  };
  
  const processedOrders = jobOrders.map(jo => {
    let computedStatus = 'Bayar Sebagian';
    if (jo.remainingBalance <= 0) computedStatus = 'Lunas';
    else if (jo.totalPaid === 0) computedStatus = 'Belum Dibayar';
    return { ...jo, status: computedStatus };
  });

  const filteredOrders = processedOrders.filter(jo => {
    const q = searchQuery.toLowerCase().trim();
    const qClean = q.replace(/[^a-z0-9]/g, '');

    const fieldsToSearch = [
      String(jo.id || ''),
      String(jo.dbId || ''),
      String(jo.jobOrderCode || ''),
      String(jo.invoiceNo || ''),
      String(jo.shipmentUn || ''),
      String(jo.vendorName || ''),
      String(jo.costType || ''),
      String(jo.financial_request_number || ''),
      String(jo.sumber || '')
    ];

    const matchNormal = fieldsToSearch.some(field => field.toLowerCase().includes(q));
    const matchClean = qClean ? fieldsToSearch.some(field => field.toLowerCase().replace(/[^a-z0-9]/g, '').includes(qClean)) : false;

    const matchSearch = !q || matchNormal || matchClean;
    const matchCostType = filterCostType === 'Semua' || jo.costType === filterCostType;
    const matchStatus = filterStatus === 'Semua' || jo.status === filterStatus;
    
    let matchBulan = true;
    if (filterBulan) {
      const joMonth = (jo.tanggal_invoice || jo.created_at || '').substring(0, 7);
      matchBulan = joMonth === filterBulan;
    }
    
    return matchSearch && matchCostType && matchStatus && matchBulan;
  });

  // Calculate stats dynamically from filteredOrders
  const stats = {
    IDR: { totalInvoice: 0, totalPaid: 0, remainingBalance: 0 },
    USD: { totalInvoice: 0, totalPaid: 0, remainingBalance: 0 }
  };
  filteredOrders.forEach(jo => {
    if (jo.currency === 'USD') {
      stats.USD.totalInvoice += jo.totalInvoice;
      stats.USD.totalPaid += jo.totalPaid;
      stats.USD.remainingBalance += jo.remainingBalance;
    } else {
      stats.IDR.totalInvoice += jo.totalInvoice;
      stats.IDR.totalPaid += jo.totalPaid;
      stats.IDR.remainingBalance += jo.remainingBalance;
    }
  });

  const handleExport = () => {
    const tanggalExport = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const periodeLabel = filterBulan
      ? namaBulan[parseInt(filterBulan.split('-')[1]) - 1] + ' ' + filterBulan.split('-')[0]
      : 'Semua Periode';

    const headerRows = [
      [`Laporan Monitoring Pembayaran — ${periodeLabel}`],
      ['PT Pahala Bahari Nusantara | Departemen EXIM — Import'],
      [`Diekspor pada: ${tanggalExport}`],
      [], 
      ['No.', 'IMP NO', 'No. Invoice', 'Vendor', 'Cost Type',
       'DPP', 'Tax', 'Total', 'Total Paid', 'Remaining', 'Status', 'Tanggal Invoice']
    ];

    const dataRows = filteredOrders.map((jo, idx) => [
      idx + 1,
      jo.shipmentUn || jo.invoiceNo || '-',
      jo.invoiceNo || '-',
      jo.vendorName || 'Manual',
      jo.costType,
      jo.dpp || 0,
      jo.tax || 0,
      jo.totalInvoice,
      jo.totalPaid,
      jo.totalInvoice - jo.totalPaid,
      jo.status,
      jo.tanggal_invoice || '-'
    ]);

    const sumRow = [
      'TOTAL', '', '', '', '', '',
      filteredOrders.reduce((s, jo) => s + (jo.dpp || 0), 0),
      filteredOrders.reduce((s, jo) => s + (jo.tax || 0), 0),
      filteredOrders.reduce((s, jo) => s + jo.totalInvoice, 0),
      filteredOrders.reduce((s, jo) => s + jo.totalPaid, 0),
      filteredOrders.reduce((s, jo) => s + (jo.totalInvoice - jo.totalPaid), 0),
      '', ''
    ];

    const allRows = [...headerRows, ...dataRows, [], sumRow];
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    ws['!cols'] = [
      {wch:4}, {wch:12}, {wch:14}, {wch:14}, {wch:20}, {wch:24},
      {wch:14}, {wch:12}, {wch:14}, {wch:14}, {wch:14}, {wch:14}, {wch:14}
    ];
    ws['!merges'] = [{ s: {r:0, c:0}, e: {r:0, c:12} }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, periodeLabel.replace(' ', '_').substring(0, 31));

    const fileName = filterBulan
      ? `MonitoringPembayaran_${periodeLabel.replace(' ', '')}_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.xlsx`
      : `MonitoringPembayaran_Semua_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };


  
  const operationalCostTypes = [
    'TRUC (Repo Depo)',
    'TRUC (Warehouse)',
    'LOLO (Reimb. Liftoff)',
    'LOLO (Reimb. Repair)',
    'DEPO',
    'OTHE (Perizinan)',
    'LINE (Freight & Local Charges Origin)',
    'LINE (Local Charges Indonesia)',
    'LINE (Extend DO / Demdet)',
    'OTHE (Customs Bond)',
    'LOLO (Port)',
    'LOLO (Hico/Bahandel)',
    'LOLO (Gudang Port)',
    'OTHE (Other Cost)'
  ];

  const uniqueCostTypes = [...new Set([...operationalCostTypes, ...jobOrders.map(jo => jo.costType).filter(Boolean)])].sort();

  const handleExportExcel = () => {
    // Siapkan data untuk diexport
    const dataToExport = filteredOrders.map(jo => ({
      'Task Unique No': jo.id,
      'Invoice No': jo.invoiceNo || '-',
      'Vendor': jo.vendorName,
      'Cost Type': jo.costType,
      'Total Cost (IDR)': formatMoney(jo.totalInvoice, 'IDR'),
      'Total Paid (IDR)': formatMoney(jo.totalPaid, 'IDR'),
      'Outstanding Balance (IDR)': formatMoney(jo.remainingBalance, 'IDR'),
      'Status': jo.status,
    }));

    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(ws, [
      ['LAPORAN FINANCIAL PAYMENT TRACKER (JOB ORDERS)'],
      [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}`],
      []
    ], { origin: 'A1' });

    XLSX.utils.sheet_add_json(ws, dataToExport, { origin: 'A4', skipHeader: false });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Payment Tracker");
    
    // Auto-size columns
    const max_width = dataToExport.reduce((w, r) => {
      Object.keys(r).forEach(key => {
        const len = r[key] ? r[key].toString().length : 0;
        w[key] = Math.max(w[key] || key.length, len);
      });
      return w;
    }, {});
    ws['!cols'] = Object.keys(max_width).map(key => ({ wch: max_width[key] + 2 }));

    XLSX.writeFile(wb, "KompasEXIM_Financial_Payment_Tracker.xlsx");
  };

  const handleDelete = (joId) => {
    setDeleteJoId(joId);
  };

  const confirmDelete = async (joId) => {
    try {
      await deleteJobOrder(joId);
      setDeleteJoId(null);
    } catch (error) {
      await alert('Gagal menghapus data: ' + error.message);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      backgroundColor: 'var(--color-canvas-parchment)',
      fontFamily: 'var(--font-family-body)',
      color: 'var(--color-ink)',
    },
    header: {
      padding: 'var(--spacing-lg) var(--spacing-xl)',
      backgroundColor: 'var(--color-canvas)',
      borderBottom: '1px solid var(--color-hairline)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontFamily: 'var(--font-family-display)',
      fontSize: '34px',
      fontWeight: '600',
      letterSpacing: '-0.374px',
      margin: '0 0 var(--spacing-xxs) 0',
      color: 'var(--color-ink)',
    },
    subtitle: {
      fontSize: '17px',
      color: 'var(--color-ink-muted-80)',
      margin: 0,
    },
    content: {
      padding: 'var(--spacing-xl)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-lg)',
      flex: 1,
    },
    kpiGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 'var(--spacing-lg)',
    },
    kpiCard: {
      backgroundColor: 'var(--color-canvas)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--rounded-lg)',
      padding: 'var(--spacing-lg)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-divider)',
    },
    kpiLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--color-ink-muted-80)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: 'var(--spacing-md)',
    },
    kpiValueRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 'var(--spacing-xs)',
    },
    kpiValue: {
      fontFamily: 'var(--font-family-display)',
      fontSize: '28px',
      fontWeight: '600',
      letterSpacing: '0.196px',
    },
    kpiSubtext: {
      fontSize: '14px',
      color: 'var(--color-ink-muted-48)',
      marginTop: 'var(--spacing-sm)',
      paddingTop: 'var(--spacing-sm)',
      borderTop: '1px solid var(--color-divider-soft)',
    },
    actionBar: {
      display: 'flex',
      gap: 'var(--spacing-md)',
      alignItems: 'center',
    },
    inputWrapper: {
      position: 'relative',
      width: '320px',
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--color-ink-muted-48)',
    },
    input: {
      width: '100%',
      padding: '12px 16px 12px 40px',
      borderRadius: 'var(--rounded-pill)',
      border: '1px solid var(--color-hairline)',
      backgroundColor: 'var(--color-canvas)',
      fontFamily: 'var(--font-family-body)',
      fontSize: '17px',
      color: 'var(--color-ink)',
      boxSizing: 'border-box',
    },
    select: {
      padding: '12px 44px 12px 20px',
      borderRadius: 'var(--rounded-pill)',
      border: '1px solid var(--color-hairline)',
      backgroundColor: 'var(--color-canvas)',
      fontFamily: 'var(--font-family-body)',
      fontSize: '17px',
      color: 'var(--color-ink)',
      cursor: 'pointer',
      maxWidth: '240px',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      appearance: 'none',
      WebkitAppearance: 'none',
      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234a4a4a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 16px center',
      backgroundSize: '16px',
    },
    tableContainer: {
      backgroundColor: 'var(--color-canvas)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--rounded-lg)',
      overflowX: 'auto',
    },
    table: {
      width: '100%',
      minWidth: '1100px',
      borderCollapse: 'collapse',
      textAlign: 'left',
    },
    th: {
      padding: '14px 20px',
      backgroundColor: 'var(--color-canvas-parchment)',
      color: 'var(--color-ink-muted-80)',
      fontSize: '14px',
      fontWeight: '600',
      borderBottom: '1px solid var(--color-hairline)',
    },
    td: {
      padding: '16px 20px',
      fontSize: '14px',
      color: 'var(--color-ink)',
      borderBottom: '1px solid var(--color-divider-soft)',
      verticalAlign: 'middle',
    },
    textGreen: {
      color: '#34c759',
      fontWeight: '600',
    },
    textRed: {
      color: '#ff3b30',
      fontWeight: '600',
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    textLinkBtn: {
      background: 'none',
      border: 'none',
      color: 'var(--color-primary)',
      fontSize: '14px',
      fontWeight: '400',
      cursor: 'pointer',
      padding: '4px 8px',
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Financial Payment Tracker</h1>
          <p style={styles.subtitle}>Proses pembayaran seluruh tagihan yang sudah diteruskan dari Financial Commitment Workspace</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Button variant="secondary" onClick={handleExport} icon={<Download size={16} />}>
            Export Excel
          </Button>
        </div>
      </div>

      <div style={styles.content}>
        {/* KPI Cards */}
        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Total Invoice Vendor</div>
            <div style={styles.kpiValueRow}>
              <div style={{...styles.kpiValue, color: 'var(--color-ink)'}}>
                {formatMoney(stats.IDR.totalInvoice, 'IDR')}
              </div>
            </div>
            <div style={styles.kpiSubtext}>
              Akumulasi seluruh tagihan vendor
              {filterBulan && (
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '4px' }}>
                  Periode: {namaBulan[parseInt(filterBulan.split('-')[1]) - 1]} {filterBulan.split('-')[0]}
                </div>
              )}
            </div>
          </div>
          
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Total Paid</div>
            <div style={styles.kpiValueRow}>
              <div style={{...styles.kpiValue, color: '#34c759'}}>
                {formatMoney(stats.IDR.totalPaid, 'IDR')}
              </div>
            </div>
            <div style={styles.kpiSubtext}>
              Pembayaran terealisasi
              {filterBulan && (
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '4px' }}>
                  Periode: {namaBulan[parseInt(filterBulan.split('-')[1]) - 1]} {filterBulan.split('-')[0]}
                </div>
              )}
            </div>
          </div>
          
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Remaining Balance</div>
            <div style={styles.kpiValueRow}>
              <div style={{...styles.kpiValue, color: '#ff3b30'}}>
                {formatMoney(stats.IDR.remainingBalance, 'IDR')}
              </div>
            </div>
            <div style={styles.kpiSubtext}>
              Total Invoice − Total Paid
              {filterBulan && (
                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', marginTop: '4px' }}>
                  Periode: {namaBulan[parseInt(filterBulan.split('-')[1]) - 1]} {filterBulan.split('-')[0]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div style={styles.actionBar}>
          <div style={styles.inputWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Cari Vendor atau IMP No..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.input}
            />
          </div>
          
          {selectedJoIds.length > 0 && (
            <Button variant="primary" onClick={() => setIsAssignModalOpen(true)} style={{ backgroundColor: '#16A34A', borderColor: '#16A34A' }}>
              Tarik ke Buku Kas ({selectedJoIds.length})
            </Button>
          )}
          <select 
            value={filterCostType} 
            onChange={(e) => setFilterCostType(e.target.value)}
            style={styles.select}
          >
            <option value="Semua">Semua Cost Type</option>
            {uniqueCostTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.select}
          >
            <option value="Semua">Semua Status</option>
            <option value="Belum Dibayar">Belum Dibayar</option>
            <option value="Bayar Sebagian">Bayar Sebagian</option>
            <option value="Lunas">Lunas</option>
          </select>
          <select 
            value={filterBulan}
            onChange={(e) => setFilterBulan(e.target.value)}
            style={styles.select}
          >
            <option value="">Semua Bulan</option>
            {availableMonths.map(m => (
              <option key={m.month_key} value={m.month_key}>
                {namaBulan[parseInt(m.bulan) - 1]} {m.tahun}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{...styles.th, width: '40px'}}>
                  <input 
                    type="checkbox" 
                    checked={filteredOrders.length > 0 && selectedJoIds.length === filteredOrders.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedJoIds(filteredOrders.map(jo => jo.id));
                      else setSelectedJoIds([]);
                    }}
                  />
                </th>
                <th style={styles.th}>IMP NO (Based on Import Project)</th>
                <th style={styles.th}>Vendor</th>
                <th style={styles.th}>Cost Type</th>
                <th style={styles.th}>DPP</th>
                <th style={styles.th}>Tax</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Total Paid</th>
                <th style={styles.th}>Remaining</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((jo) => (
                <tr key={jo.id} style={{ backgroundColor: selectedJoIds.includes(jo.id) ? '#F0FDF4' : 'transparent' }}>
                  <td style={styles.td}>
                    <input 
                      type="checkbox" 
                      checked={selectedJoIds.includes(jo.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedJoIds([...selectedJoIds, jo.id]);
                        else setSelectedJoIds(selectedJoIds.filter(id => id !== jo.id));
                      }}
                    />
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '700', color: 'var(--color-ink)', marginBottom: '4px' }}>
                      {jo.shipmentUn || jo.invoiceNo || '-'}
                    </div>
                    {jo.sumber === 'import_operational' && jo.shipmentId && (
                      <Link to={`/workspace/import-operational/${jo.shipmentId}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}>
                        <LinkIcon size={12} /> View Shipment
                      </Link>
                    )}
                    {jo.sumber === 'terputus' && (
                      <div style={{ fontSize: '10px', color: 'var(--color-status-danger)', fontWeight: '600', backgroundColor: 'var(--color-status-danger-bg)', display: 'inline-block', padding: '2px 4px', borderRadius: '4px' }}>
                        Terputus
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>{jo.vendorName}</td>
                  <td style={{...styles.td, color: 'var(--color-ink-muted-80)'}}>
                    {jo.costType}
                    {jo.sumber === 'import_operational' && (
                      <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: '#f0f0f0', color: '#666', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                        Dari Import Op.
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>{formatMoney(jo.dpp, jo.currency)}</td>
                  <td style={styles.td}>
                    {formatMoney(jo.tax, jo.currency)}
                  </td>
                  <td style={{...styles.td, fontWeight: '700'}}>{formatMoney(jo.totalInvoice, jo.currency)}</td>
                  <td style={{...styles.td, color: '#34c759', fontWeight: '600'}}>{formatMoney(jo.totalPaid, jo.currency)}</td>
                  <td style={{...styles.td, color: jo.remainingBalance > 0 ? '#ff3b30' : 'var(--color-ink)', fontWeight: '600'}}>
                    {formatMoney(jo.remainingBalance, jo.currency)}
                  </td>
                  <td style={styles.td}>
                    <Badge type="paymentstatus" value={jo.status} />
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      {canWritePayment(user) && (
                        <Button variant="utility" onClick={() => setUpdateJoId(jo.id)}>
                          Update
                        </Button>
                      )}
                      {jo.payments && jo.payments.length > 0 && (
                        <button style={styles.textLinkBtn} onClick={() => setHistoryJoId(jo.id)}>
                          Riwayat
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(jo.id)}
                        style={{ ...styles.textLinkBtn, color: '#dc2626', backgroundColor: '#fef2f2', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Hapus Tagihan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="8" style={{...styles.td, textAlign: 'center', color: 'var(--color-ink-muted-48)', padding: '40px'}}>
                    Tidak ada data tagihan ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && <AddInvoiceModal onClose={() => setIsAddOpen(false)} />}
      {updateJoId && <UpdatePaymentModal joId={updateJoId} onClose={() => setUpdateJoId(null)} />}
      {historyJoId && <PaymentHistoryModal joId={historyJoId} onClose={() => setHistoryJoId(null)} />}
      {deleteJoId && <DeleteConfirmModal joId={deleteJoId} onConfirm={() => confirmDelete(deleteJoId)} onClose={() => setDeleteJoId(null)} />}
      <AssignToMtbModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        selectedOrders={filteredOrders.filter(jo => selectedJoIds.includes(jo.id))}
        onSuccess={() => {
          setSelectedJoIds([]);
          fetchJobOrders();
        }}
      />
    </div>
  );
};

export default PaymentDashboard;
