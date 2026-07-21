import React, { useState } from 'react';
import usePaymentStore from '../../../store/usePaymentStore';
import useAuthStore from '../../../store/useAuthStore';
import { canWritePayment } from '../../../utils/authHelpers';
import { Plus, Search, Paperclip, ChevronRight, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddInvoiceModal from './AddInvoiceModal';
import UpdatePaymentModal from './UpdatePaymentModal';
import PaymentHistoryModal from './PaymentHistoryModal';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';

const PaymentDashboard = () => {
  const { jobOrders, getKpiStats } = usePaymentStore();
  const { user } = useAuthStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [updateJoId, setUpdateJoId] = useState(null);
  const [historyJoId, setHistoryJoId] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCostType, setFilterCostType] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const stats = getKpiStats();
  
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
    const matchSearch = jo.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        jo.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCostType = filterCostType === 'Semua' || jo.costType === filterCostType;
    const matchStatus = filterStatus === 'Semua' || jo.status === filterStatus;
    return matchSearch && matchCostType && matchStatus;
  });

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
      padding: '12px 20px',
      borderRadius: 'var(--rounded-pill)',
      border: '1px solid var(--color-hairline)',
      backgroundColor: 'var(--color-canvas)',
      fontFamily: 'var(--font-family-body)',
      fontSize: '17px',
      color: 'var(--color-ink)',
      cursor: 'pointer',
    },
    tableContainer: {
      backgroundColor: 'var(--color-canvas)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--rounded-lg)',
      overflow: 'hidden',
    },
    table: {
      width: '100%',
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
          <h1 style={styles.title}>Financial Tracker</h1>
          <p style={styles.subtitle}>{filteredOrders.length} job order tercatat</p>
        </div>
        {canWritePayment(user) && (
          <Button onClick={() => setIsAddOpen(true)} variant="primary" style={{ gap: '8px' }}>
            <Plus size={18} /> Tambah Tagihan
          </Button>
        )}
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
            <div style={styles.kpiSubtext}>Akumulasi seluruh tagihan vendor</div>
          </div>
          
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Total Paid</div>
            <div style={styles.kpiValueRow}>
              <div style={{...styles.kpiValue, color: '#34c759'}}>
                {formatMoney(stats.IDR.totalPaid, 'IDR')}
              </div>
            </div>
            <div style={styles.kpiSubtext}>Pembayaran terealisasi</div>
          </div>
          
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Remaining Balance</div>
            <div style={styles.kpiValueRow}>
              <div style={{...styles.kpiValue, color: '#ff3b30'}}>
                {formatMoney(stats.IDR.remainingBalance, 'IDR')}
              </div>
            </div>
            <div style={styles.kpiSubtext}>Total Invoice – Total Paid</div>
          </div>
        </div>

        {/* Action Bar */}
        <div style={styles.actionBar}>
          <div style={styles.inputWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Cari Vendor atau Job Order ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.input}
            />
          </div>
          <select 
            value={filterCostType} 
            onChange={(e) => setFilterCostType(e.target.value)}
            style={styles.select}
          >
            <option value="Semua">Semua Cost Type</option>
            <option value="Ocean Freight">Ocean Freight</option>
            <option value="THC">THC</option>
            <option value="Custom Duty">Custom Duty</option>
            <option value="Demurrage">Demurrage</option>
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.select}
          >
            <option value="Semua">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Bayar Sebagian">Bayar Sebagian</option>
            <option value="Belum Dibayar">Belum Dibayar</option>
          </select>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Job Order ID / UN</th>
                <th style={styles.th}>Vendor</th>
                <th style={styles.th}>Cost Type</th>
                <th style={styles.th}>Total Invoice</th>
                <th style={styles.th}>Total Paid</th>
                <th style={styles.th}>Remaining</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((jo) => (
                <tr key={jo.id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600', marginBottom: jo.sumber ? '4px' : '0' }}>{jo.id}</div>
                    {jo.sumber === 'import_operational' && jo.shipmentId && (
                      <Link to={`/workspace/import-operational/${jo.shipmentId}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}>
                        <LinkIcon size={12} /> {jo.shipmentUn || 'View Shipment'}
                      </Link>
                    )}
                    {jo.sumber === 'terputus' && (
                      <div style={{ fontSize: '10px', color: 'var(--color-status-danger)', fontWeight: '600', backgroundColor: 'var(--color-status-danger-bg)', display: 'inline-block', padding: '2px 4px', borderRadius: '4px' }}>
                        Terputus
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>{jo.vendorName}</td>
                  <td style={{...styles.td, color: 'var(--color-ink-muted-80)'}}>{jo.costType}</td>
                  <td style={styles.td}>{formatMoney(jo.totalInvoice, jo.currency)}</td>
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
    </div>
  );
};

export default PaymentDashboard;
