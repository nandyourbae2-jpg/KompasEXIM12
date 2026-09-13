import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../../../components/Button';

const DeleteConfirmModal = ({ joId, onConfirm, onClose }) => {
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'var(--color-canvas)',
      borderRadius: 'var(--rounded-lg)',
      width: '100%',
      maxWidth: '400px',
      boxShadow: 'rgba(0, 0, 0, 0.22) 0px 15px 40px',
      overflow: 'hidden',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      padding: 'var(--spacing-lg) var(--spacing-lg) 0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    iconWrapper: {
      width: '40px',
      height: '40px',
      borderRadius: 'var(--rounded-full)',
      backgroundColor: 'var(--color-status-danger-bg)',
      color: 'var(--color-status-danger)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    title: {
      fontFamily: 'var(--font-family-display)',
      fontSize: '21px',
      fontWeight: '600',
      letterSpacing: '0.231px',
      margin: 0,
      color: 'var(--color-ink)',
    },
    body: {
      padding: 'var(--spacing-sm) var(--spacing-lg) var(--spacing-xl)',
      marginLeft: '52px',
      marginTop: '-4px',
    },
    message: {
      fontSize: '15px',
      lineHeight: '1.47',
      color: 'var(--color-ink-muted-80)',
      margin: 0,
    },
    joHighlight: {
      fontWeight: '600',
      color: 'var(--color-ink)',
    },
    footer: {
      padding: 'var(--spacing-md) var(--spacing-lg)',
      backgroundColor: 'var(--color-canvas-parchment)',
      borderTop: '1px solid var(--color-hairline)',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
    },
    btnCancel: {
      backgroundColor: 'var(--color-canvas)',
      color: 'var(--color-ink)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--rounded-pill)',
      padding: '10px 20px',
      fontSize: '15px',
      fontWeight: '400',
      cursor: 'pointer',
    },
    btnDelete: {
      backgroundColor: 'var(--color-status-danger)',
      color: 'var(--color-canvas)',
      border: 'none',
      borderRadius: 'var(--rounded-pill)',
      padding: '10px 20px',
      fontSize: '15px',
      fontWeight: '400',
      cursor: 'pointer',
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}
      </style>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <AlertTriangle size={20} />
          </div>
          <h2 style={styles.title}>Hapus Tagihan?</h2>
        </div>
        <div style={styles.body}>
          <p style={styles.message}>
            Yakin ingin menghapus tagihan <span style={styles.joHighlight}>{joId}</span>? Tindakan ini juga akan menghapus seluruh riwayat pembayarannya secara permanen.
          </p>
        </div>
        <div style={styles.footer}>
          <button 
            style={styles.btnCancel} 
            onClick={onClose}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-pearl)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-canvas)'}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Batal
          </button>
          <button 
            style={styles.btnDelete} 
            onClick={onConfirm}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
