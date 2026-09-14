# Departemen Export (Sea & Air Freight Outbound)

## 📌 Ringkasan Departemen
Departemen Export bertanggung jawab atas pengelolaan pengiriman kargo ke luar negeri (outbound), mulai dari pemesanan kontainer ke pelayaran (Shipping Line Booking), pengajuan Pemberitahuan Ekspor Barang (PEB), penerbitan Nota Pelayanan Ekspor (NPE), verifikasi timbangan kargo (VGM), hingga pemuatan barang ke kapal/pesawat (Stuffing & Loading).

---

## 🗺️ Pemetaan Komponen & File Terkait

### 1. Frontend (User Interface)
* **Halaman Export Utama:** `src/pages/Export.jsx` / `src/pages/ExportPage.jsx`
* **Shipping Instructions & Booking:** `src/components/export/BookingForm.jsx`
* **Customs Export (PEB/NPE):** `src/components/export/CustomsExport.jsx`
* **Stuffing & Container Tracking:** `src/components/export/ContainerInspection.jsx`

### 2. Backend (API & Business Logic)
* **Controller:** 
  * `backend/src/controllers/exportController.js`
  * `backend/src/controllers/shippingInstructionController.js`
* **Service:** 
  * `backend/src/services/ExportService.js`
* **Database Table:** 
  * `export_orders`, `shipping_instructions`, `peb_declarations`, `export_containers`

### 3. Automated Test Terkait
* Skrip E2E: `testing/e2e/logistic/` dan `testing/e2e/regression/`
* Laporan Verifikasi: `testing/reports/E2E_TEST_REPORT.md` (Bagian CUJ 4 - Export Logistics)

---

## 🔄 Alur Bisnis Inti (Core User Journey)
1. **Shipping Instruction (SI) & Space Booking:** Pengajuan alokasi kontainer ke shipping line/airline.
2. **Pemberitahuan Ekspor Barang (PEB):** Input data barang ekspor ke sistem INSW/Bea Cukai.
3. **Penerbitan NPE (Nota Pelayanan Ekspor):** Verifikasi barang siap muat dan izin muat dari Bea Cukai terbit.
4. **Closing Cargo & On-Board Confirmation:** Konfirmasi kargo telah naik ke atas kapal/pesawat (B/L Issued).
