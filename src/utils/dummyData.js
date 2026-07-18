export const dummyTasks = [
  { id: "TSK-0085", title: "B/L MSC URGENT", department: "Import", priority: "Kritis", status: "Backlog", assigneeId: 3, dueDate: "14 Jul", dueDateIso: "2026-07-14", created_at: "2026-07-01T09:00:00Z", updated_at: "2026-07-02T10:00:00Z" },
  { id: "TSK-0086", title: "PIB SO-9912", department: "Import", priority: "Tinggi", status: "Akan Dikerjakan", assigneeId: 3, dueDate: "15 Jul", dueDateIso: "2026-07-15", created_at: "2026-07-02T09:00:00Z", updated_at: "2026-07-05T10:00:00Z" },
  { id: "TSK-0087", title: "Packing List C-22", department: "Export", priority: "Sedang", status: "Dalam Proses", assigneeId: 2, dueDate: "16 Jul", dueDateIso: "2026-07-16", created_at: "2026-07-03T09:00:00Z", updated_at: "2026-07-10T10:00:00Z" },
  { id: "TSK-0088", title: "COO Form E", department: "Export", priority: "Rendah", status: "Review", assigneeId: 2, dueDate: "18 Jul", dueDateIso: "2026-07-18", created_at: "2026-07-04T09:00:00Z", updated_at: "2026-07-11T10:00:00Z" },
  { id: "TSK-0089", title: "Quotation EMKL", department: "Administrasi Export (AE)", priority: "Sedang", status: "Backlog", assigneeId: 9, dueDate: "20 Jul", dueDateIso: "2026-07-20", created_at: "2026-07-05T09:00:00Z", updated_at: "2026-07-05T10:00:00Z" },
  { id: "TSK-0090", title: "Asuransi Kargo Z", department: "Administrasi Export (AE)", priority: "Tinggi", status: "Akan Dikerjakan", assigneeId: 9, dueDate: "14 Jul", dueDateIso: "2026-07-14", created_at: "2026-07-06T09:00:00Z", updated_at: "2026-07-12T10:00:00Z" },
  { id: "TSK-0091", title: "Rekon Tagihan MAERSK", department: "Account Officer", priority: "Kritis", status: "Dalam Proses", assigneeId: 10, dueDate: "13 Jul", dueDateIso: "2026-07-13", created_at: "2026-07-07T09:00:00Z", updated_at: "2026-07-12T10:00:00Z" },
  { id: "TSK-0092", title: "Invoice Vendor #123", department: "Account Officer", priority: "Sedang", status: "Selesai", assigneeId: 10, dueDate: "10 Jul", dueDateIso: "2026-07-10", created_at: "2026-07-01T09:00:00Z", updated_at: "2026-07-09T10:00:00Z", completed_at: "2026-07-09T10:00:00Z" },
  { id: "TSK-0093", title: "Delivery Order (DO) Pelindo", department: "Import", priority: "Kritis", status: "Review", assigneeId: 3, dueDate: "12 Jul", dueDateIso: "2026-07-12", created_at: "2026-07-08T09:00:00Z", updated_at: "2026-07-11T10:00:00Z" },
  { id: "TSK-0094", title: "Surat Jalan Ekspor", department: "Export", priority: "Rendah", status: "Selesai", assigneeId: 2, dueDate: "09 Jul", dueDateIso: "2026-07-09", created_at: "2026-07-01T09:00:00Z", updated_at: "2026-07-10T10:00:00Z", completed_at: "2026-07-10T10:00:00Z" },
  { id: "TSK-0095", title: "Draft B/L CMA CGM", department: "Export", priority: "Tinggi", status: "Dalam Proses", assigneeId: 2, dueDate: "15 Jul", dueDateIso: "2026-07-15", created_at: "2026-07-09T09:00:00Z", updated_at: "2026-07-13T10:00:00Z" }
];

export const dummyDocuments = [
  { id: "DOC-001", fileName: "BL_Original_20240712.pdf", type: "Bill of Lading", reference: "BL-20240712", department: "Import", version: "v2", uploadedBy: "Ahmad F.", date: "10 Jul 2024", size: "1.2 MB", tags: ["Original"], status: "Tervalidasi" },
  { id: "DOC-002", fileName: "PackingList_EX4820_Final.pdf", type: "Packing List", reference: "EX-4820", department: "Export", version: "v2", uploadedBy: "Sari R.", date: "09 Jul 2024", size: "840 KB", tags: ["Final"], status: "Tervalidasi" },
  { id: "DOC-003", fileName: "CommInvoice_INV2024-0395.pdf", type: "Commercial Invoice", reference: "BL-20240712", department: "Account Officer", version: "v1", uploadedBy: "Jori", date: "10 Jul 2024", size: "620 KB", tags: ["Invoice"], status: "Tervalidasi" },
  { id: "DOC-004", fileName: "COO_EX4820_Garuda.pdf", type: "Certificate of Origin", reference: "EX-4820", department: "Export", version: "v1", uploadedBy: "Sari R.", date: "08 Jul 2024", size: "530 KB", tags: ["COO"], status: "Tervalidasi" },
  { id: "DOC-005", fileName: "PIB_BL20240712_Priok.pdf", type: "PIB/PEB", reference: "BL-20240712", department: "Import", version: "v1", uploadedBy: "Ahmad F.", date: "10 Jul 2024", size: "780 KB", tags: ["PIB", "Priok"], status: "Tervalidasi" },
  { id: "DOC-006", fileName: "SuratJalan_BL20240710.pdf", type: "Surat Jalan", reference: "BL-20240710", department: "Import", version: "v1", uploadedBy: "Hendra W.", date: "07 Jul 2024", size: "310 KB", tags: ["Surat Jalan"], status: "Tervalidasi" },
  { id: "DOC-007", fileName: "DO_BL20240710_SPIL.pdf", type: "DO (Delivery Order)", reference: "BL-20240710", department: "Import", version: "v1", uploadedBy: "Budi S.", date: "07 Jul 2024", size: "450 KB", tags: ["DO", "SPIL"], status: "Tervalidasi" },
  { id: "DOC-008", fileName: "Jasindo_Marine_BL20240714.pdf", type: "Asuransi Kargo", reference: "BL-20240714", department: "Import", version: "v1", uploadedBy: "Budi S.", date: "06 Jul 2024", size: "920 KB", tags: ["Asuransi", "Jasindo"], status: "Menunggu Validasi" },
  { id: "DOC-009", fileName: "Quotation_Samudera_EX4825.pdf", type: "Quotation", reference: "EX-4825", department: "Administrasi Export (AE)", version: "v3", uploadedBy: "Dewi A.", date: "05 Jul 2024", size: "280 KB", tags: ["Quotation", "Samudera"], status: "Tervalidasi" },
  { id: "DOC-010", fileName: "PackingList_EX4815_v1.pdf", type: "Packing List", reference: "EX-4815", department: "Export", version: "v1", uploadedBy: "Sari R.", date: "04 Jul 2024", size: "760 KB", tags: ["Draft"], status: "Kadaluarsa" },
  { id: "DOC-011", fileName: "Quotation_MSC_EX4828.pdf", type: "Quotation", reference: "EX-4828", department: "Administrasi Export (AE)", version: "v1", uploadedBy: "Jori", date: "11 Jul 2024", size: "305 KB", tags: ["Quotation", "MSC"], status: "Menunggu Validasi" },
  { id: "DOC-012", fileName: "SuratJalan_EX4820_Trucking.pdf", type: "Surat Jalan", reference: "EX-4820", department: "Export", version: "v1", uploadedBy: "Sari R.", date: "12 Jul 2024", size: "415 KB", tags: ["Trucking"], status: "Tervalidasi" }
];

export const dummyJobOrders = [
  {
    id: "JO-2024-0712",
    vendorName: "Samudera Shipping",
    costType: "Ocean Freight",
    currency: "IDR",
    totalInvoice: 185000000,
    totalPaid: 185000000,
    remainingBalance: 0,
    status: "Lunas",
    dueDate: "2026-07-24", // Asumsi 14 hari dari tgl invoice
    payments: [
      { id: "PAY-1", amount: 185000000, date: "10 Jul 2024", method: "Bank Transfer", by: "System" }
    ]
  },
  {
    id: "JO-2024-0714",
    vendorName: "Meratus Line",
    costType: "THC",
    currency: "USD",
    totalInvoice: 4200,
    totalPaid: 2000,
    remainingBalance: 2200,
    status: "Bayar Sebagian",
    dueDate: "2026-07-25",
    payments: [
      { id: "PAY-2", amount: 2000, date: "11 Jul 2024", method: "Bank Transfer", by: "System" }
    ]
  },
  {
    id: "JO-2024-0708",
    vendorName: "Tanto Intim",
    costType: "Demurrage",
    currency: "IDR",
    totalInvoice: 42000000,
    totalPaid: 0,
    remainingBalance: 42000000,
    status: "Belum Dibayar",
    dueDate: "2026-07-20",
    payments: []
  },
  {
    id: "JO-2024-0705",
    vendorName: "SPIL",
    costType: "Custom Duty",
    currency: "IDR",
    totalInvoice: 28500000,
    totalPaid: 15000000,
    remainingBalance: 13500000,
    status: "Bayar Sebagian",
    dueDate: "2026-07-22",
    payments: [
      { id: "PAY-3", amount: 15000000, date: "12 Jul 2024", method: "Petty Cash", by: "System" }
    ]
  },
  {
    id: "JO-2024-0701",
    vendorName: "Meratus Line",
    costType: "Ocean Freight",
    currency: "IDR",
    totalInvoice: 587500000,
    totalPaid: 412200000,
    remainingBalance: 175300000,
    status: "Bayar Sebagian",
    dueDate: "2026-07-15",
    payments: [
      { id: "PAY-4", amount: 412200000, date: "09 Jul 2024", method: "Bank Transfer", by: "System" }
    ]
  }
];
