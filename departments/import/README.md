# Departemen Import (Sea & Air Freight)

## 📌 Ringkasan Departemen
Departemen Import bertanggung jawab atas penanganan pengiriman kargo masuk (inbound shipments) melalui jalur laut (Sea Freight / FCL & LCL) maupun jalur udara (Air Freight), termasuk proses pengurusan kepabeanan (Customs Clearance / PIB), tracking dokumen, dan delivery order (DO).

---

## 🗺️ Pemetaan Komponen & File Terkait

### 1. Frontend (User Interface)
* **Halaman Import Utama:** `src/pages/Import.jsx` / `src/pages/ImportPage.jsx`
* **Manajemen Pengiriman (Shipments):** `src/pages/Shipments.jsx`, `src/pages/ShipmentDetailPage.jsx`
* **Customs / Kepabeanan:** `src/components/import/` & `src/pages/CustomsPage.jsx`
* **Tracking Status & Alur:** `src/components/shipment/`

### 2. Backend (API & Business Logic)
* **Controller:** 
  * `backend/src/controllers/shipmentController.js`
  * `backend/src/controllers/customsController.js`
* **Service:** 
  * `backend/src/services/ShipmentService.js`
  * `backend/src/services/CustomsService.js`
* **Database Table:** 
  * `shipments`, `customs_declarations`, `shipment_milestones`, `delivery_orders`

### 3. Automated Test Terkait
* Skrip E2E: `testing/e2e/import/`
* Laporan Verifikasi: `testing/reports/E2E_TEST_REPORT.md` (Bagian CUJ 1 - Import Workflow)

---

## 🔄 Alur Bisnis Inti (Core User Journey)
1. **Penerimaan Pre-Alert & Manifest:** Entry data AWB/BL dari agent luar negeri.
2. **Pengajuan Dokumen Kepabeanan (PIB):** Perhitungan Bea Masuk, PPN, PPh, dan penentuan Jalur (Hijau, Kuning, Merah).
3. **Pembayaran & SPPB (Surat Persetujuan Pengeluaran Barang):** Validasi release dari Bea Cukai.
4. **Delivery Order (DO) & Pengeluaran Kontainer:** Koordinasi armada trucking hingga barang sampai ke gudang consignee.
