# Master Prompt — Figma AI: Kompas EXIM

> **Cara pakai:** copy seluruh isi di bawah garis ini, paste langsung ke prompt box Figma AI (atau AI design tool sejenis) dalam satu kali kirim. Prompt ini sudah menyertakan contoh data supaya hasil mockup langsung terisi (tidak kosong/placeholder generik).

---

Buatkan desain web app internal bernama **"Kompas EXIM"** — sistem Task Tracer & Manajemen Kerja untuk Departemen EXIM (Export-Import) sebuah perusahaan shipping & logistik bernama PT Pahala Bahari Nusantara. Tagline: "Satu arah, semua departemen terlihat — tak ada tugas yang tersesat."

## Gaya Desain
- Tema: **maritim/navigasi** namun tetap korporat-profesional (bukan playful berlebihan). Aksen ikon kompas/peta pada logo dan empty state.
- Warna dasar: navy blue (#1E3A5F atau sejenis) sebagai warna utama, putih/abu terang sebagai background, dengan warna aksen status: hijau (selesai/lunas), biru (dalam proses), amber/oranye (tertunda/sebagian), merah (kritis/belum dibayar/terlambat).
- Tipografi: sans-serif bersih (mis. Inter/Manrope), heading tegas, body text mudah dibaca di tabel padat data.
- Layout: card-based, banyak tabel data rapi, sidebar kiri persisten setelah login, topbar dengan identitas user & notifikasi.
- Bahasa UI: **Bahasa Indonesia** untuk semua label, tombol, dan konten.

## Struktur Halaman

Buat 6 layar berikut, saling terhubung sebagai satu alur (clickable prototype flow: Landing → Login → Peta Tugas → [Sidebar navigasi ke Dokumen/Keuangan/Dashboard Manager]):

---

### 1. Landing Page (publik, tanpa login)
- Hero section: judul "Kompas EXIM", tagline, ilustrasi bertema peta pelayaran/kompas, tombol utama **"Masuk ke Workspace"**.
- Banner reminder yang ramah (carousel), contoh isi: "Setiap kontainer yang tepat waktu adalah kepercayaan yang terjaga 🚢", "3 tugas menanti hari ini — yuk mulai dari yang paling dekat tenggatnya!"
- Section "Cara Penggunaan" dalam bentuk 4 langkah interaktif (accordion/carousel dengan ikon nomor): (1) Login sesuai role, (2) Kelola tugas di Peta Tugas, (3) Upload & kelola dokumen shipment, (4) Pantau pembayaran vendor real-time.
- Grid "Fitur Unggulan" — 4 kartu dengan ikon: Peta Tugas, Manajemen Dokumen, Monitoring Pembayaran, Dashboard Manager.
- Diagram struktur organisasi: kotak "Departemen EXIM" di atas, bercabang ke 4 kotak di bawahnya: **Import**, **Export**, **Account Executive**, **Account Officer**, masing-masing dengan 1 baris deskripsi singkat tugasnya.
- Footer sederhana dengan nama perusahaan.

### 2. Login Page
- Card login di tengah layar dengan logo Kompas EXIM di atas.
- Dropdown **"Workspace Role"** dengan opsi: Import, Export, Account Officer, Account Executive, Supervisor.
- Input **"Employee ID"** (contoh placeholder: EMP-0231).
- Input **"Password"** dengan toggle show/hide.
- Checkbox "Ingat saya", link "Lupa password?".
- Tombol **"Masuk"** full-width.

### 3. Peta Tugas (Kanban Board) — halaman utama setelah login
Header: "Peta Tugas" dengan subjudul jumlah total tugas. Filter dropdown "Semua Departemen" dan "Semua Prioritas", tombol **"+ Tambah Tugas"** di kanan atas.

5 kolom board: **Backlog**, **Akan Dikerjakan**, **Dalam Proses**, **Review**, **Selesai** — masing-masing dengan counter jumlah kartu.

Isi dengan contoh kartu tugas berikut (gunakan persis sebagai sample data):

| Kolom | ID | Judul | Badge Prioritas | Badge Departemen | Assignee | Tenggat | Progress |
|---|---|---|---|---|---|---|---|
| Backlog | TSK-0095 | Evaluasi tarif SPIL Q3 2024 | Rendah | Import | Hendra W. | 25 Jul | – |
| Backlog | TSK-0094 | Update template invoice ekspor | Sedang | Account Officer | Rina P. | 22 Jul | – |
| Akan Dikerjakan | TSK-0093 | Siapkan B/L draft — EX-4825 | Tinggi | Ekspor | Sari R. | 14 Jul | – |
| Akan Dikerjakan | TSK-0092 | Koordinasi asuransi kargo BL-20240714 | Sedang | Import | Budi S. | 13 Jul | – |
| Dalam Proses | TSK-0091 | Clearance BC 2.0 — BL-20240712 | Kritis | Import | Ahmad F. | 12 Jul | 65% |
| Dalam Proses | TSK-0090 | Pemenuhan SO ekspor PT Karya Maju | Tinggi | Account Executive | Dewi A. | 15 Jul | 40% |
| Review | TSK-0088 | Verifikasi packing list EX-4820 | Sedang | Ekspor | Sari R. | 11 Jul | 95% |
| Review | TSK-0087 | Rekonsiliasi tagihan vendor Jul 2024 | Tinggi | Account Officer | Ahmad F. | 10 Jul | 90% |
| Selesai | TSK-0086 | Submit PIB BL-20240709 | Kritis | Import | Ahmad F. | 09 Jul | 100% |
| Selesai | TSK-0085 | Issue invoice INV-2024-0381 | Sedang | Account Officer | Rina P. | 08 Jul | 100% |

Kartu di kolom Backlog menampilkan tombol **"← Mundur"** (disabled/abu) dan **"Maju →"** (aktif/biru). Kartu di kolom lain menampilkan progress bar berwarna biru (di bawah 100%) atau hijau (100%).

### 4. Sidebar Navigasi (persisten di semua halaman setelah login)
Urutan item: **Peta Tugas**, **Manajemen Dokumen**, **Monitoring Pembayaran**, **Dashboard Manager** (beri badge kecil "SPV" untuk menandakan item ini khusus role Supervisor), lalu di bagian bawah: Profil Saya, Logout. Item aktif di-highlight.

### 5. Manajemen Dokumen
Layout: sidebar filter kiri + tabel utama kanan.

Sidebar filter kiri, "Tipe Dokumen" dengan counter: Semua (12), Bill of Lading (2), Packing List (2), Commercial Invoice (1), Certificate of Origin (1), PIB/PEB (2), Surat Jalan (1), DO/Delivery Order (1), Asuransi Kargo (1), Quotation (1). Di bawahnya filter "Departemen" (Semua, Import, Ekspor, Account Executive, Account Officer) dan "Status" (Semua, Aktif, Pending Verifikasi, Kadaluarsa).

Area kanan: search bar "Cari nama file, B/L, atau tag...", toggle List/Grid, tombol **"↑ Upload Dokumen"**. Tabel dengan kolom: Nama File, Tipe (badge warna), B/L, Departemen, Versi, Upload Oleh, Tanggal, Ukuran. Isi dengan contoh baris:

- BL_Original_20240712.pdf — Bill of Lading — BL-20240712 — Import — v1 — Ahmad F. — 10 Jul 2024 — 1.2 MB
- PackingList_EX4820_Final.pdf — Packing List — EX-4820 — Ekspor — v2 — Sari R. — 09 Jul 2024 — 840 KB
- CommInvoice_INV2024-0395.pdf — Commercial Invoice — BL-20240712 — Account Officer — v1 — Rina P. — 10 Jul 2024 — 620 KB
- PIB_BL20240712_Priok.pdf — PIB/PEB — BL-20240712 — Import — v1 — Ahmad F. — 10 Jul 2024 — 780 KB

### 6. Monitoring Pembayaran EXIM (Keuangan) — halaman baru
Header "Monitoring Pembayaran EXIM" dengan 3 KPI card di atas: **Total Invoice Vendor** (contoh: IDR 842.500.000), **Total Paid** (contoh: IDR 614.200.000), **Remaining Balance** (contoh: IDR 228.300.000).

Tabel Financial Tracker dengan kolom: Job Order ID, Vendor Name, Cost Type, Total Invoice, Total Paid, Remaining Balance, Payment Status (badge), Actions. Contoh isi:

| Job Order ID | Vendor Name | Cost Type | Total Invoice | Total Paid | Remaining | Status |
|---|---|---|---|---|---|---|
| JO-2024-0712 | Samudera Shipping | Ocean Freight | IDR 185.000.000 | IDR 185.000.000 | IDR 0 | Lunas (hijau) |
| JO-2024-0714 | Meratus Line | THC | USD 4.200 | USD 2.000 | USD 2.200 | Bayar Sebagian (amber) |
| JO-2024-0708 | Tanto Intim | Demurrage | IDR 42.000.000 | IDR 0 | IDR 42.000.000 | Belum Dibayar (merah) |

Tombol **"Update Pembayaran"** di kolom Actions membuka modal **"Input Realisasi Pembayaran — JO-2024-0714"** berisi input: Jumlah Bayar Baru (angka), Tanggal Bayar (date picker), Metode (dropdown: Bank Transfer, Petty Cash), Bukti Transfer (drag-drop file upload area). Tombol submit "Simpan Pembayaran".

### 7. Dashboard Manager (khusus role Supervisor)
Judul "Dashboard Manager" dengan subjudul "PT Pahala Bahari Nusantara — Data per 10 Juli 2024".

4 KPI card atas: Container Aktif (63 unit, ▲+8 minggu ini), Clearance Tertunda (14 dokumen, ▼-3 dari kemarin), DND Charges (IDR 28,4jt, ▼+IDR 4,2jt hari ini), On-Time Delivery (87%, ▲+2% vs bulan lalu).

Area tengah: line chart "Volume Pengiriman (2024)" dengan 2 garis (Ekspor, Import) dari Jan–Jul, dan donut chart "Distribusi Status Tugas" (Selesai 148, Dalam Proses 63, Tertunda 24, Terlambat 9).

Area bawah: tabel "Tugas Terbaru" (ID, Tugas, Assignee, Tenggat, Prioritas, Status) dan list "Performa Vendor" dengan progress bar skor + breakdown Biaya% dan Kepatuhan% untuk: Samudera Shipping (94%), Meratus Line (88%), SPIL (82%), Tanto Intim (79%).

---

Buat seluruh 7 layar di atas sebagai satu file desain yang saling terhubung (prototype flow), dengan komponen yang reusable (badge, card, sidebar) agar konsisten antar halaman.
