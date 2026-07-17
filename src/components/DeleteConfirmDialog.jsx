import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * DeleteConfirmDialog
 *
 * Dialog konfirmasi sebelum menghapus task.
 * Muncul di tengah layar dengan backdrop gelap.
 * Ikuti prinsip Apple minimal-motion: tidak ada animasi tambahan,
 * hanya perubahan warna pada tombol aksi utama.
 *
 * Props:
 *   taskTitle   — string, judul task yang akan dihapus (ditampilkan di pesan)
 *   onConfirm   — function, dipanggil saat "Hapus" diklik
 *   onCancel    — function, dipanggil saat "Batal" diklik atau backdrop diklik
 */
const DeleteConfirmDialog = ({ taskTitle, onConfirm, onCancel }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 1200,
        }}
      />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1201,
          width: '380px',
          maxWidth: 'calc(100vw - 48px)',
          backgroundColor: 'var(--color-canvas)',
          borderRadius: 'var(--rounded-lg)',
          boxShadow: 'var(--shadow-product)',
          padding: '28px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Icon + Teks */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{
            width: '40px', height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-status-danger-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AlertTriangle size={20} color="var(--color-status-danger)" />
          </div>

          <div>
            <h3
              id="delete-dialog-title"
              style={{
                fontSize: '17px',
                fontWeight: '600',
                color: 'var(--color-ink)',
                letterSpacing: '-0.374px',
                marginBottom: '6px',
                lineHeight: 1.3,
              }}
            >
              Hapus tugas ini?
            </h3>
            <p
              id="delete-dialog-desc"
              style={{
                fontSize: '14px',
                color: 'var(--color-ink-muted-80)',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: 'var(--color-ink)', fontWeight: '600' }}>
                "{taskTitle}"
              </strong>{' '}
              akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </p>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
        }}>
          {/* Batal */}
          <button
            onClick={onCancel}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--rounded-pill)',
              border: '1px solid var(--color-hairline)',
              backgroundColor: 'var(--color-canvas)',
              color: 'var(--color-ink)',
              fontSize: '14px',
              fontWeight: '400',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-body)',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => e.target.style.backgroundColor = 'var(--color-canvas-parchment)'}
            onMouseLeave={e => e.target.style.backgroundColor = 'var(--color-canvas)'}
          >
            Batal
          </button>

          {/* Hapus — merah, menggunakan status-danger */}
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--rounded-pill)',
              border: 'none',
              backgroundColor: 'var(--color-status-danger)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-body)',
              transition: 'transform 0.1s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Hapus
          </button>
        </div>
      </div>
    </>
  );
};

export default DeleteConfirmDialog;
