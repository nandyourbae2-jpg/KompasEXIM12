# KOMPAS EXIM
### Peta Tugas & Manajemen Kerja Departemen Export–Import
**PT Pahala Bahari Nusantara**

> *"Satu arah, semua departemen terlihat — tak ada tugas yang tersesat."*

| | |
|---|---|
| **Dokumen** | Product Requirement Document (PRD) |
| **Produk** | Kompas EXIM (Task Tracer & Management System) |
| **Departemen** | EXIM — Import, Export, Account Executive, Account Officer |
| **Disusun oleh** | Ken |
| **Versi** | 1.0 |
| **Tanggal** | 12 Juli 2026 |
| **Status** | Draft untuk review internal / bahan lanjutan prototype Figma |

---

## Catatan Penamaan

Nama **"Kompas EXIM"** dipilih karena dua alasan:
1. **Relevansi bisnis** — PBN adalah perusahaan *bahari* (maritim); kompas adalah alat navigasi yang paling identik dengan pelayaran.
2. **Relevansi fungsi** — tujuan utama produk ini adalah membantu SPV/Manager "menemukan arah" di tengah banyaknya tugas lintas departemen, sama seperti kompas menunjukkan arah di tengah laut.

Turunan penamaan yang dipakai di seluruh produk agar konsisten dan tidak generik:
- Dashboard Kanban (sebelumnya "Papan Kanban") → **"Peta Tugas"** (task map — searah dengan tema navigasi, dan secara fungsi memang menggambarkan "peta" posisi setiap tugas).
- Dashboard SPV → **"Dashboard Nakhoda"** *(opsional — lihat catatan di bagian 7.7)*, atau tetap "Dashboard Manager" bila tim merasa istilah "Nakhoda" terlalu playful untuk konteks formal ke atasan. Kamu bisa pilih salah satu saat implementasi.

Dokumen ini melanjutkan prototype yang sudah kamu buat di Figma AI, sekaligus melengkapinya dengan modul baru (Monitoring Pembayaran) dan menstandarkan seluruh flow menjadi satu PRD yang bisa langsung dipakai tim development atau sebagai prompt lanjutan.

---

## Daftar Isi

1. Ringkasan Eksekutif
2. Latar Belakang & Masalah
3. Tujuan Produk
4. Peran Pengguna & Hak Akses
5. Arsitektur Informasi (Sitemap)
6. Alur Pengguna Utama
7. Spesifikasi Fitur per Halaman
   - 7.1 Landing Page
   - 7.2 Login Page
   - 7.3 Peta Tugas (Kanban)
   - 7.4 Sidebar Navigasi
   - 7.5 Manajemen Dokumen
   - 7.6 Monitoring Pembayaran EXIM (Keuangan)
   - 7.7 Dashboard Manager (SPV)
8. Model Data (Entities)
9. Kebutuhan Non-Fungsional
10. Metrik Keberhasilan
11. Roadmap Pengembangan
12. Lampiran

---

## 1. Ringkasan Eksekutif

Kompas EXIM adalah aplikasi web internal untuk Departemen EXIM PT Pahala Bahari Nusantara yang menggabungkan **manajemen tugas (task tracer)**, **manajemen dokumen shipment**, **monitoring pembayaran vendor**, dan **dashboard eksekutif** ke dalam satu platform. Produk ini menggantikan proses tracking manual berbasis Excel yang saat ini digunakan Departemen Import, dengan tujuan memberi visibilitas real-time kepada SPV atas seluruh workflow lintas sub-divisi (Import, Export, Account Executive, Account Officer).

## 2. Latar Belakang & Masalah

Saat ini proses tracking pekerjaan EXIM dilakukan secara terpisah di masing-masing sub-divisi menggunakan spreadsheet Excel, dengan beberapa masalah yang teridentifikasi:

- **Tidak ada visibilitas terpusat** — SPV harus meminta update manual dari tiap staf untuk mengetahui status pekerjaan.
- **Data tersebar** — dokumen shipment (B/L, Packing List, PIB/PEB, dsb.) tersimpan di folder/email masing-masing tanpa versi yang jelas.
- **Monitoring pembayaran manual** — status pembayaran ke vendor (shipping line, EMKL) dihitung manual, rawan salah rekap, dan tidak terhubung ke bukti dokumennya.
- **Rawan human error** — sebagaimana ditemukan pada audit workbook Excel Task Tracer (kesalahan formula, data hardcoded, pergeseran kolom), sistem berbasis file statis sulit dijaga konsistensinya saat dipakai banyak orang.

## 3. Tujuan Produk

**Tujuan utama:** memudahkan SPV melihat workflow dari tiap departemen (Import, Export, Account Executive, Account Officer) agar seluruh pekerjaan terkondisikan dan termonitor secara real-time — tanpa perlu menunggu laporan manual.

Tujuan turunan:
- Memberi setiap staf satu tempat kerja (single source of truth) untuk tugas, dokumen, dan status pembayaran.
- Mengurangi ketergantungan pada Excel yang rawan error dan sulit diaudit.
- Mempercepat proses klaim DND/Demurrage dan rekonsiliasi tagihan vendor melalui pencatatan yang otomatis terhubung ke dokumen bukti.
- Membangun budaya kerja yang lebih terpantau namun tetap terasa positif dan tidak menekan (bukan tools "pengawasan", tapi tools "navigasi bersama").

## 4. Peran Pengguna & Hak Akses

| Role | Deskripsi | Akses Utama |
|---|---|---|
| **Import** | Staf sub-divisi Import: clearance, PIB, DND, trucking | Peta Tugas (filter default: Import), Manajemen Dokumen, Monitoring Pembayaran (input & lihat) |
| **Export** | Staf sub-divisi Export: B/L, COO, packing list, SO ekspor | Peta Tugas (filter default: Export), Manajemen Dokumen |
| **Account Executive** | Menangani quotation, koordinasi vendor & asuransi kargo | Peta Tugas (filter default: AE), Manajemen Dokumen |
| **Account Officer** | Menangani invoice, rekonsiliasi tagihan vendor | Peta Tugas (filter default: AO), Manajemen Dokumen, Monitoring Pembayaran (full akses) |
| **Supervisor (SPV)** | Mengawasi seluruh sub-divisi | Semua Peta Tugas lintas departemen, semua Dokumen, semua Pembayaran, **Dashboard Manager** (eksklusif) |

**Prinsip akses:** setiap role melihat datanya sendiri secara default, namun tetap bisa memfilter/melihat lintas departemen bila diberi izin (khusus Account Officer & Supervisor untuk modul Keuangan, karena sifatnya lintas divisi).

## 5. Arsitektur Informasi (Sitemap)

```
Kompas EXIM
│
├── Landing Page (publik, tanpa login)
│   └── → Login
│
├── Login Page
│   └── → Peta Tugas (redirect sesuai role)
│
└── Workspace (setelah login — layout dengan Sidebar)
    ├── Peta Tugas          (default landing setelah login)
    ├── Manajemen Dokumen
    ├── Monitoring Pembayaran (Keuangan)
    ├── Dashboard Manager    (khusus role Supervisor)
    └── Profil & Logout
```

## 6. Alur Pengguna Utama

1. User membuka **Landing Page** → membaca reminder motivasi, cara pakai, dan struktur departemen → klik **"Masuk ke Workspace"**.
2. Di **Login Page**, user memilih **Workspace Role**, mengisi **Employee ID** dan **Password** → submit.
3. Setelah berhasil login, user diarahkan ke **Peta Tugas** yang sudah otomatis terfilter sesuai role-nya.
4. Melalui **Sidebar**, user dapat berpindah ke Manajemen Dokumen, Monitoring Pembayaran, atau (jika Supervisor) Dashboard Manager.
5. Saat meng-update pembayaran di modul Keuangan dan mengunggah bukti transfer, dokumen tersebut otomatis tersinkron dan muncul di Manajemen Dokumen dengan tag "Bukti Pembayaran".

---

## 7. Spesifikasi Fitur per Halaman

### 7.1 Landing Page

**Tujuan:** memberi kesan pertama yang ramah, mengedukasi user baru tentang cara pakai, dan menjadi pintu masuk ke Login.

**Komponen:**

| Komponen | Detail |
|---|---|
| Hero Section | Judul "Kompas EXIM", tagline navigasi, ilustrasi bertema maritim/peta pelayaran, tombol **"Masuk ke Workspace"** (→ Login Page) |
| Banner Reminder Semangat | Kartu dengan pesan rotasi yang ramah & memotivasi, contoh: *"Setiap kontainer yang tepat waktu adalah kepercayaan yang terjaga 🚢"*, *"3 tugas menanti hari ini — yuk mulai dari yang paling dekat tenggatnya!"*. Pesan berganti otomatis (carousel) setiap beberapa detik. |
| Cara Penggunaan (Interaktif) | Komponen step-by-step berbentuk accordion/carousel dengan 4 langkah: (1) Login sesuai role, (2) Kelola tugas di Peta Tugas, (3) Upload & kelola dokumen shipment, (4) Pantau pembayaran vendor real-time. Setiap step bisa diklik untuk expand dengan ilustrasi/screenshot kecil. |
| Fitur Unggulan | Grid 4 kartu: **Peta Tugas**, **Manajemen Dokumen**, **Monitoring Pembayaran**, **Dashboard Manager** — masing-masing dengan ikon dan deskripsi singkat 1 kalimat. |
| Struktur Departemen EXIM | Diagram organisasi sederhana: **Departemen EXIM** di puncak, bercabang ke 4 kotak: **Import, Export, Account Executive, Account Officer** — masing-masing dengan 1 baris deskripsi tanggung jawab. |
| Footer | Nama perusahaan, tahun, kontak IT support internal. |

**Acceptance Criteria:**
- [ ] Halaman dapat diakses tanpa login.
- [ ] Banner reminder berganti otomatis, tidak mengganggu (bisa di-dismiss).
- [ ] Section "Cara Penggunaan" interaktif (expand/collapse atau carousel), bukan teks statis panjang.
- [ ] Tombol login mengarahkan ke Login Page.
- [ ] Diagram struktur departemen menampilkan keempat sub-divisi dengan jelas.
- [ ] Responsif di desktop & mobile.

---

### 7.2 Login Page

**Komponen:**
1. **Dropdown "Workspace Role"** — pilihan: Import, Export, Account Officer, Account Executive, Supervisor.
2. **Input "Employee ID"**.
3. **Input "Password"** (dengan show/hide password).
4. Checkbox **"Ingat saya"** (opsional).
5. Link **"Lupa password?"**.
6. Tombol **"Masuk"**.
7. State error: Employee ID/Password salah, role tidak sesuai dengan akun.

**Logika:**
- Kombinasi Role + Employee ID + Password divalidasi ke sistem sebelum redirect.
- Setelah sukses, sistem otomatis menerapkan filter default sesuai role pada Peta Tugas (mis. role Import → filter default "Import", role Supervisor → tanpa filter/semua departemen).

**Acceptance Criteria:**
- [ ] Semua field wajib diisi sebelum tombol "Masuk" aktif.
- [ ] Pesan error jelas dan tidak generik (mis. "Employee ID tidak ditemukan" vs "Password salah").
- [ ] Role yang dipilih konsisten dengan hak akses akun (tidak bisa login sebagai role lain dari akun yang berbeda).

---

### 7.3 Peta Tugas *(dahulu "Papan Kanban")*

Mengikuti referensi wireframe yang sudah dibuat, dengan penyempurnaan struktur berikut:

**Kolom Status:** Backlog → Akan Dikerjakan → Dalam Proses → Review → Selesai (masing-masing menampilkan jumlah tugas).

**Komponen Kartu Tugas:**
| Elemen | Detail |
|---|---|
| Badge Prioritas | Rendah (abu), Sedang (biru), Tinggi (oranye), Kritis (merah) |
| Badge Departemen | Import, Ekspor, Account Executive, Account Officer |
| ID Tugas | Format `TSK-00XX` |
| Judul Tugas | Referensi ke B/L atau nomor SO bila relevan |
| Assignee | Avatar inisial + nama |
| Tenggat | Format tanggal `DD Mon` |
| Progress bar | Muncul untuk kartu di kolom "Dalam Proses" & "Review" |
| Tombol Mundur / Maju | Muncul di kolom Backlog untuk memindah status secara manual |

**Filter Global:** Semua Departemen, Semua Prioritas, tombol **"+ Tambah Tugas"**.

**Acceptance Criteria:**
- [ ] Task otomatis terfilter sesuai role saat pertama kali login, namun user bisa mengubah filter untuk melihat departemen lain (read-only bila bukan miliknya, kecuali Supervisor).
- [ ] Drag-and-drop antar kolom (atau tombol Maju/Mundur) memperbarui status secara real-time.
- [ ] Progress bar ter-update otomatis bila ada sub-checklist yang diselesaikan (opsional fase 2).
- [ ] Klik kartu membuka detail tugas (deskripsi, riwayat perubahan, komentar).

---

### 7.4 Sidebar Navigasi

**Item Sidebar (top-to-bottom):**
1. Peta Tugas
2. Manajemen Dokumen
3. Monitoring Pembayaran (Keuangan)
4. Dashboard Manager *(hanya tampil untuk role Supervisor)*
5. — divider —
6. Profil Saya
7. Logout

**Perilaku:**
- Bisa di-collapse menjadi ikon saja (hemat ruang di layar kecil).
- Item aktif diberi highlight sesuai halaman yang sedang dibuka.
- Badge notifikasi kecil (mis. jumlah dokumen "Pending Verifikasi" atau tagihan "Belum Dibayar") muncul di sebelah item terkait.

---

### 7.5 Manajemen Dokumen

Mengikuti struktur pada wireframe yang sudah ada:

**Sidebar Filter:**
- **Tipe Dokumen** (dengan jumlah): Bill of Lading, Packing List, Commercial Invoice, Certificate of Origin, PIB/PEB, Surat Jalan, DO (Delivery Order), Asuransi Kargo, Quotation, **Bukti Pembayaran** *(baru — lihat 7.6)*.
- **Departemen**: Import, Ekspor, Account Executive, Account Officer.
- **Status**: Aktif, Pending Verifikasi, Kadaluarsa.

**Area Utama:**
- Search bar ("Cari nama file, B/L, atau tag...").
- Toggle tampilan List/Grid.
- Tabel dokumen dengan kolom: Nama File, Tipe, No. B/L, Departemen, Versi, Upload Oleh, Tanggal, Ukuran, Tag.
- Tombol **"Upload Dokumen"** → modal dengan input: file, tipe dokumen, nomor referensi (B/L/SO), departemen, tag bebas.

**Acceptance Criteria:**
- [ ] Filter tipe/departemen/status dapat dikombinasikan.
- [ ] Setiap dokumen menyimpan versi (v1, v2, dst.) tanpa menimpa file lama.
- [ ] Dokumen yang diunggah dari modul Monitoring Pembayaran otomatis muncul di sini dengan tipe "Bukti Pembayaran" dan ter-link ke Job Order ID terkait.

---

### 7.6 Monitoring Pembayaran EXIM (Keuangan)

Modul baru, dapat diakses dari Sidebar oleh role **Account Officer** dan **Supervisor** (role lain bisa lihat read-only bila relevan dengan job order miliknya).

**A. Financial KPI Cards (atas halaman)**

| Kartu | Deskripsi |
|---|---|
| Total Invoice Vendor | Akumulasi seluruh invoice vendor yang tercatat |
| Total Paid | Akumulasi seluruh pembayaran yang sudah direalisasikan |
| Remaining Balance | Total Invoice − Total Paid (seluruh job order) |

**B. Tabel Financial Tracker**

| Kolom | Detail |
|---|---|
| Job Order ID | Referensi unik pekerjaan |
| Vendor Name | Nama shipping line / EMKL |
| Cost Type | Ocean Freight, THC, Custom Duty, Demurrage |
| Total Invoice (IDR/USD) | Nilai tagihan |
| Total Paid | Akumulasi pembayaran |
| Remaining Balance | **Auto-calculated** = Total Invoice − Total Paid |
| Payment Status | Badge otomatis (lihat aturan di bawah) |
| Actions | Tombol **"Update Pembayaran"** |

**Aturan Badge Status Pembayaran:**

| Kondisi | Badge | Warna |
|---|---|---|
| Remaining == 0 | Lunas | Hijau |
| Paid > 0 dan Remaining > 0 | Bayar Sebagian | Amber |
| Paid == 0 | Belum Dibayar | Merah |

**C. Modal "Input Realisasi Pembayaran — [Job Order ID]"**

Dipicu oleh tombol "Update Pembayaran" pada tiap baris. Input:
- **Jumlah Bayar Baru** (angka)
- **Tanggal Bayar** (date picker)
- **Metode** (dropdown: Bank Transfer, Petty Cash)
- **Bukti Transfer** (file upload — mock untuk prototype)

**Logika Perhitungan:**
1. `Total Paid_baru = Total Paid_lama + Jumlah Bayar Baru`
2. `Remaining Balance_baru = Total Invoice − Total Paid_baru`
3. Badge status dihitung ulang otomatis berdasarkan tabel aturan di atas, tanpa perlu refresh halaman.
4. File **Bukti Transfer** yang diunggah otomatis tersinkron ke **Manajemen Dokumen** (tipe dokumen: "Bukti Pembayaran", ter-tag dengan Job Order ID dan Vendor Name), sehingga histori pembayaran dan dokumennya selalu terhubung satu sama lain.

**Acceptance Criteria:**
- [ ] Perhitungan Remaining Balance selalu otomatis, tidak bisa diinput manual.
- [ ] Badge status berubah secara dinamis begitu modal disubmit, tanpa reload halaman.
- [ ] Riwayat pembayaran (histori tiap "Jumlah Bayar Baru") dapat dilihat per Job Order (log, bukan hanya angka akhir).
- [ ] Upload bukti transfer wajib sebelum submit (validasi).
- [ ] Dokumen yang tersinkron ke Manajemen Dokumen dapat diklik langsung dari histori pembayaran (dan sebaliknya).

---

### 7.7 Dashboard Manager (SPV)

Mengikuti struktur wireframe yang sudah ada, khusus untuk role **Supervisor**:

| Komponen | Detail |
|---|---|
| KPI Cards | Container Aktif, Clearance Tertunda, DND Charges (IDR), On-Time Delivery (%) — masing-masing dengan indikator naik/turun dibanding periode sebelumnya |
| Grafik Volume Pengiriman | Line chart Ekspor vs Import per bulan (Jan–Jul), dengan filter rentang waktu |
| Distribusi Status Tugas | Donut chart: Selesai, Dalam Proses, Tertunda, Terlambat (lintas seluruh departemen) |
| Tabel Tugas Terbaru | ID, Tugas, Assignee, Tenggat, Prioritas, Status — dengan link "Lihat semua" ke Peta Tugas penuh |
| Performa Vendor | List vendor dengan progress bar skor keseluruhan + breakdown Biaya% dan Kepatuhan% |

**Catatan penamaan:** Dashboard ini bisa tetap disebut **"Dashboard Manager"** (formal, aman untuk laporan ke atasan), atau **"Dashboard Nakhoda"** bila ingin konsisten dengan tema navigasi Kompas EXIM — silakan pilih sesuai selera tim/atasan kamu.

**Acceptance Criteria:**
- [ ] Data pada dashboard ini bersifat agregat lintas seluruh sub-divisi (bukan hanya satu departemen).
- [ ] Hanya bisa diakses oleh role Supervisor.
- [ ] Klik pada tiap KPI card dapat drill-down ke data detail terkait (mis. klik "DND Charges" → daftar Job Order dengan DND aktif).

---

## 8. Model Data (Entities Ringkas)

| Entity | Field Utama |
|---|---|
| **User** | employee_id, nama, role, departemen, password_hash |
| **Task** | task_id, judul, departemen, prioritas, status, assignee, tenggat, progress, referensi_dokumen |
| **Document** | file_id, nama_file, tipe, no_referensi (B/L/SO), departemen, versi, upload_oleh, tanggal, ukuran, tag[], status |
| **Invoice/Payment** | job_order_id, vendor_name, cost_type, total_invoice, total_paid, remaining_balance, status, riwayat_pembayaran[] |
| **PaymentLog** | log_id, job_order_id, jumlah_bayar, tanggal_bayar, metode, file_bukti_id (→ Document) |
| **Vendor** | vendor_id, nama, jenis (shipping line/EMKL), skor_biaya, skor_kepatuhan |

---

## 9. Kebutuhan Non-Fungsional

- **Role-based access control (RBAC)** ketat di seluruh modul, terutama Monitoring Pembayaran dan Dashboard Manager.
- **Audit trail** untuk setiap perubahan status tugas dan setiap update pembayaran (siapa, kapan, nilai sebelum/sesudah).
- **Validasi input** pada seluruh form (angka tidak boleh negatif, tanggal tidak boleh di masa depan untuk tanggal bayar, dll).
- **Notifikasi** untuk tugas mendekati tenggat dan dokumen berstatus "Pending Verifikasi"/"Kadaluarsa".
- **Bahasa** antarmuka utama: Bahasa Indonesia (istilah teknis logistik/keuangan tetap dalam Bahasa Inggris sesuai konvensi industri, seperti pada wireframe existing).
- **Responsif** di desktop dan tablet minimal; mobile sebagai nice-to-have di fase awal.

## 10. Metrik Keberhasilan

- Berkurangnya waktu SPV untuk mendapatkan status pekerjaan lintas departemen (target: dari manual/harian menjadi real-time).
- Berkurangnya penggunaan Excel Task Tracer sebagai sumber data utama.
- Peningkatan akurasi rekonsiliasi tagihan vendor (berkurangnya selisih akibat pencatatan manual).
- Waktu rata-rata penyelesaian klaim DND/Demurrage.
- Tingkat kepatuhan tenggat tugas (on-time completion rate) per departemen.

## 11. Roadmap Pengembangan

| Fase | Cakupan |
|---|---|
| **Fase 1** | Landing Page, Login Page, Peta Tugas (Kanban), Sidebar dasar |
| **Fase 2** | Manajemen Dokumen (upload, filter, versi) |
| **Fase 3** | Monitoring Pembayaran EXIM (Keuangan) + integrasi bukti transfer ke Manajemen Dokumen |
| **Fase 4** | Dashboard Manager (SPV) + drill-down KPI + notifikasi |

## 12. Lampiran

- Referensi wireframe: Papan Kanban EXIM, Manajemen Dokumen, Dashboard Import Manager (disediakan sebagai baseline desain oleh Ken).
- Dokumen ini dapat digunakan sebagai dasar penyusunan prompt lanjutan untuk Figma AI atau brief ke tim development.

---
*Dokumen ini adalah draft v1.0 — terbuka untuk direvisi bersama tim SPV/IT sebelum masuk tahap development.*
