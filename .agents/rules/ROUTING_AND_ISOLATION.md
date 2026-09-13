---
description: Aturan ketat mengenai penambahan fitur, manajemen rute (routing), dan isolasi antar-departemen agar sistem tidak bertabrakan.
---

# Routing & Module Isolation Guidelines

Repositori Kompas EXIM memiliki arsitektur navigasi yang menggabungkan **Dynamic Registry** (`departmentFeatures.jsx`) dengan **Static Layout Wrappers** (`App.jsx`). 
Untuk mencegah rusaknya UI/UX departemen yang sudah ada (seperti terlempar ke *Peta Tugas* atau layout menu yang hilang), **patuhi aturan berikut tanpa pengecualian.**

## 1. Aturan Penambahan Rute Baru di `App.jsx`
- **Standalone Details (Halaman Detail):** Rute untuk halaman detail (misal: `/workspace/import-operational/:id`) **TIDAK** bisa ditangani secara otomatis oleh *Dynamic Registry*. Rute ini harus ditambahkan secara manual dan statis di `App.jsx` di bawah *Access Control* yang sesuai (contoh: `<OperationalRoute>`).
- **Sub-Layout Wrappers:** Jika suatu fitur departemen memiliki layout khusus dengan navigasi sekunder (contoh: `<ImportOpsLayout />`), semua *children route* (halaman anak) **wajib** diregistrasikan di dalam `App.jsx` sebagai anak dari layout tersebut.

## 2. Aturan Registrasi di `departmentFeatures.jsx`
*Registry* ini adalah otak yang menentukan apa yang muncul di *Sidebar*.
- **Default Behavior:** Jika Anda mendaftarkan item tanpa properti `path` eksplisit, Sidebar akan menghasilkan URL `/workspace/staff/[key]`, yang kemudian akan ditangkap oleh *catch-all* `DynamicStaffPage`. Hal ini akan me-render komponen secara telanjang tanpa *Sub-Layout*.
- **Explicit Binding:** Jika menu tersebut sudah memiliki rute dan layout khusus di `App.jsx`, Anda **WAJIB** memberikan properti `path` eksplisit. 
  *Contoh Benar:*
  `{ key: 'import-operational', component: 'ImportOpsList', path: '/workspace/import-operational' }`
  *Contoh Salah:* 
  `{ key: 'import-operational', component: 'ImportOpsList' }` (Akan merusak tata letak).

## 3. Isolasi Antar-Departemen (Strict Isolation)
- **Jangan Menyentuh Modul Tetangga:** Saat Anda diminta untuk mengembangkan fitur untuk "AE" (Administrasi Export), Anda **DILARANG KERAS** memodifikasi array menu, *routing*, atau *state* milik departemen "Import", "AO", "Finance", dsb., kecuali diperintahkan secara eksplisit.
- **Backward Compatibility:** Jangan pernah menghapus rute statis lama di `App.jsx` hanya karena menganggapnya redundan dengan *Dynamic Registry*, kecuali Anda sudah memastikan 100% bahwa halaman tersebut tidak bergantung pada `<LayoutWrapper>` khusus.

## 4. Fallback Routing Awareness
Sistem `App.jsx` memiliki rute *catch-all* fallback. Jika URL tidak terdaftar, user akan dilempar ke `/workspace`, yang mana akan dieksekusi oleh `<IndexRedirect />`, dan akhirnya bermuara di *Peta Tugas* (`/workspace/tasks`).
- Jika Anda mendapati bug di mana user "kesasar" ke Peta Tugas saat mengeklik suatu menu, **itu adalah indikasi kuat bahwa rute tersebut terhapus, typo, atau tidak dikonfigurasi secara statis di `App.jsx`.**

## 5. UI/UX Konsistensi
- Pastikan bahwa setiap departemen mempertahankan desainnya masing-masing. Jika departemen A menggunakan *Segmented Control Tabs* (gaya Apple), terapkan itu pada lokup departemen A tanpa memaksakannya ke tata letak departemen B jika tidak diminta.
