import re

with open('src/pages/Workspace/Payment/PaymentDashboard.jsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { Plus, Search, Paperclip, ChevronRight, Link as LinkIcon, Download, DollarSign, Activity, FileText } from 'lucide-react';",
"import { Plus, Search, Paperclip, ChevronRight, Link as LinkIcon, Download, DollarSign, Activity, FileText, Trash2 } from 'lucide-react';\nimport * as XLSX from 'xlsx';")

# 2. Add fetchJobOrders, deleteJobOrder
content = content.replace("const { jobOrders, getKpiStats, fetchJobOrders } = usePaymentStore();",
"const { jobOrders, getKpiStats, fetchJobOrders, deleteJobOrder } = usePaymentStore();")

# 3. Add operationalCostTypes, uniqueCostTypes, handleDelete, handleExportExcel
content = content.replace("const styles = {", """
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
      ['LAPORAN FINANCIAL TRACKER (JOB ORDERS)'],
      [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}`],
      []
    ], { origin: 'A1' });

    XLSX.utils.sheet_add_json(ws, dataToExport, { origin: 'A4', skipHeader: false });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Tracker");
    
    // Auto-size columns
    const max_width = dataToExport.reduce((w, r) => {
      Object.keys(r).forEach(key => {
        const len = r[key] ? r[key].toString().length : 0;
        w[key] = Math.max(w[key] || key.length, len);
      });
      return w;
    }, {});
    ws['!cols'] = Object.keys(max_width).map(key => ({ wch: max_width[key] + 2 }));

    XLSX.writeFile(wb, "KompasEXIM_Financial_Tracker.xlsx");
  };

  const handleDelete = async (joId) => {
    if (window.confirm(`Yakin ingin menghapus tagihan ${joId}? Tindakan ini juga akan menghapus riwayat pembayarannya.`)) {
      try {
        await deleteJobOrder(joId);
      } catch (error) {
        alert('Gagal menghapus data: ' + error.message);
      }
    }
  };

  const styles = {""")

# 4. Fix select style
content = re.sub(r'select: \{\s+padding: \'12px 20px\',[^}]+\},', '''select: {
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
    },''', content)

# 5. Fix filterCostType dropdown
content = re.sub(r'<select[^>]+value=\{filterCostType\}[^>]+>.*?<\/select>', '''<select 
            value={filterCostType} 
            onChange={(e) => setFilterCostType(e.target.value)}
            style={styles.select}
          >
            <option value="Semua">Semua Cost Type</option>
            {uniqueCostTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>''', content, flags=re.DOTALL)

# 6. Add Trash button
content = re.sub(r'(<button[^>]+onClick=\{[^}]*setHistoryJoId[^}]*\}[^>]*>\s*History\s*<\/button>)', r'''\1
                      <button 
                        onClick={() => handleDelete(jo.id)}
                        style={{ ...styles.textLinkBtn, color: '#dc2626', backgroundColor: '#fef2f2', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Hapus Tagihan"
                      >
                        <Trash2 size={16} />
                      </button>''', content)

with open('src/pages/Workspace/Payment/PaymentDashboard.jsx', 'w') as f:
    f.write(content)
