# SOP Simulasi KOMPAS EXIM (Hari Senin)

Dokumen ini adalah pengingat langkah-langkah untuk menyalakan server dan membuka jalur publik (Pinggy) saat simulasi.

## LOKASI FOLDER PROYEK
Pastikan semua perintah dijalankan di dalam folder utama Anda:
`/Users/macbookair/Downloads/KOMPAS EXIM`

---

## TAHAP 1: Menyalakan Server Utama
1. Buka aplikasi **Terminal** di Mac Anda.
2. Masuk ke folder proyek dengan mengetik perintah berikut, lalu tekan Enter:
   ```bash
   cd ~/Downloads/"KOMPAS EXIM"
   ```
3. Nyalakan mesin server:
   ```bash
   npm start
   ```
4. **PENTING:** Biarkan jendela Terminal ini terus terbuka selama simulasi berlangsung.

---

## TAHAP 2: Membuka Jalur Publik (Pinggy)
1. Buka jendela **Terminal BARU** (tekan `Cmd + N`).
2. Jalankan perintah Pinggy ini:
   ```bash
   ssh -p 443 -R0:localhost:3001 a.pinggy.io
   ```
3. Jika muncul pertanyaan _"Are you sure you want to continue connecting?"_, ketik **yes** lalu Enter.
4. Copy link yang berawalan `https://` dan berakhiran `.pinggy.link` dari layar hitam yang muncul.

---

## TAHAP 3: Buka di Browser
1. Buka link Pinggy tersebut di browser.
2. Sangat disarankan membuka menggunakan **Mode Samaran (Incognito Window)** agar browser tidak membaca sisa memori (cache) lama.
3. Login sebagai Manager:
   - ID: **EXIM-MGR-01**
   - Password: **123456**

Semoga simulasi Anda berjalan sukses dan memukau! 🚀
