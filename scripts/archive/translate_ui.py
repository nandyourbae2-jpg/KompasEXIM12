import sys

# Translate ActionFormEngine.jsx
with open('src/pages/Staff/ActionFormEngine.jsx', 'r') as f:
    engine = f.read()

engine = engine.replace('Please verify the document and choose a result:', 'Silakan periksa dokumen ini dan pilih hasil pengecekan:')
engine = engine.replace('Reason for rejection...', 'Tulis alasan kenapa ditolak/revisi...')
engine = engine.replace('Optional remark...', 'Catatan tambahan (opsional)...')
engine = engine.replace('Remark (Optional)', 'Catatan Tambahan (Opsional)')
engine = engine.replace('Remark {decision', 'Catatan {decision')
engine = engine.replace('* (Required)', '* (Wajib Diisi)')
engine = engine.replace('[ COMPLETE ]', '[ SELESAI ]')
engine = engine.replace('Received From', 'Diterima Dari')
engine = engine.replace('Recipient', 'Penerima (Email Ke)')
engine = engine.replace('Destination / AO', 'Tujuan (Divisi/AO)')
engine = engine.replace('Enter ${label.toLowerCase()}...', 'Masukkan data ${label.toLowerCase()}...')
engine = engine.replace('Please complete the physical or system action for this document.', 'Silakan kerjakan tugas ini terlebih dahulu. Jika sudah beres, klik tombol SELESAI di bawah.')
engine = engine.replace('PASS', 'BENAR')
engine = engine.replace('FAIL / REVISI', 'SALAH / REVISI')

with open('src/pages/Staff/ActionFormEngine.jsx', 'w') as f:
    f.write(engine)


# Translate AeJobWorkbench.jsx
with open('src/pages/Staff/AeJobWorkbench.jsx', 'r') as f:
    workbench = f.read()

workbench = workbench.replace('WHAT YOU NEED TO DO', 'TUGAS SAAT INI')
workbench = workbench.replace('Semua Selesai!', 'Semua Tugas Selesai!')
workbench = workbench.replace('Tidak ada tugas yang perlu dikerjakan saat ini.', 'Tidak ada tugas yang perlu Anda kerjakan saat ini.')
workbench = workbench.replace('Document:', 'Dokumen:')
workbench = workbench.replace('Tugas ini dikerjakan oleh Staff Dept.', 'Tugas ini hanya bisa dikerjakan oleh Staff Export.')
workbench = workbench.replace('>DOCUMENTS<', '>DOKUMEN<')
workbench = workbench.replace('Tidak ada dokumen untuk job ini.', 'Belum ada dokumen untuk job ini.')
workbench = workbench.replace('>STATUS<', '>STATUS<')
workbench = workbench.replace('Current Stage', 'Tahap Saat Ini')
workbench = workbench.replace('Blocker', 'Kendala (Blocker)')
workbench = workbench.replace('Handover', 'Serah Terima')
workbench = workbench.replace('Not Ready', 'Belum Siap')
workbench = workbench.replace('Yes', 'Ada')
workbench = workbench.replace('>None<', '>Tidak Ada<')
workbench = workbench.replace('>MY DATA<', '>DATA OPERASIONAL<')
workbench = workbench.replace('Save Data', 'Simpan Data')
workbench = workbench.replace('Saving...', 'Menyimpan...')
workbench = workbench.replace('>ACTIVITY<', '>RIWAYAT AKTIVITAS<')
workbench = workbench.replace('No activity logged yet.', 'Belum ada riwayat aktivitas.')

with open('src/pages/Staff/AeJobWorkbench.jsx', 'w') as f:
    f.write(workbench)
