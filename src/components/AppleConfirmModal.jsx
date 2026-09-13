import React from 'react';
import { Share2, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

/**
 * AppleConfirmModal
 *
 * Modal konfirmasi dengan ciri khas Apple Design System:
 * - Frosted glass backdrop blur
 * - Surface putih bersih dengan hairline border halus
 * - SF Pro Typography & negative letter-spacing
 * - Full-pill action buttons dengan active scale micro-interaction
 * - Branding Kompas EXIM
 */
const AppleConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  eyebrow = 'KOMPAS EXIM • DOKUMEN OPERASIONAL',
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'primary', // 'primary' | 'danger' | 'info'
  icon,
  loading = false,
}) => {
  if (!isOpen) return null;

  // Render icon based on variant if not custom provided
  const renderIcon = () => {
    if (icon) return icon;
    if (variant === 'danger') {
      return <AlertTriangle size={24} color="var(--color-status-danger, #ff3b30)" />;
    }
    if (variant === 'info') {
      return <Info size={24} color="var(--color-primary, #0066cc)" />;
    }
    return <Share2 size={24} color="var(--color-primary, #0066cc)" />;
  };

  const getIconBg = () => {
    if (variant === 'danger') return 'var(--color-status-danger-bg, #ffe9e8)';
    return 'rgba(0, 102, 204, 0.08)';
  };

  const getConfirmBg = () => {
    if (variant === 'danger') return 'var(--color-status-danger, #ff3b30)';
    return 'var(--color-primary, #0066cc)';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        padding: '20px',
        animation: 'appleFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <style>{`
        @keyframes appleFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes applePopUp {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .apple-modal-btn:active {
          transform: scale(0.95);
        }
        .apple-modal-cancel:hover {
          background-color: var(--color-divider-soft, #f0f0f0) !important;
        }
        .apple-modal-confirm:hover {
          filter: brightness(1.08);
        }
        @keyframes appleSpinner {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          width: '400px',
          maxWidth: '100%',
          backgroundColor: 'var(--color-canvas, #ffffff)',
          borderRadius: 'var(--rounded-lg, 18px)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          padding: '28px 24px 24px',
          textAlign: 'center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'applePopUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box',
        }}
      >
        {/* Close Button (top right) */}
        <button
          onClick={onClose}
          disabled={loading}
          aria-label="Tutup"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'var(--color-canvas-parchment, #f5f5f7)',
            color: 'var(--color-ink-muted-48, #7a7a7a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s, transform 0.1s',
          }}
          className="apple-modal-btn"
        >
          <X size={14} />
        </button>

        {/* Icon Circle */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: getIconBg(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
          }}
        >
          {renderIcon()}
        </div>

        {/* Eyebrow / Brand tag */}
        <span
          style={{
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted-48, #7a7a7a)',
            marginBottom: '6px',
            fontFamily: 'var(--font-family-body, -apple-system, BlinkMacSystemFont, sans-serif)',
          }}
        >
          {eyebrow}
        </span>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 10px',
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--color-ink, #1d1d1f)',
            letterSpacing: '-0.374px',
            lineHeight: 1.3,
            fontFamily: 'var(--font-family-display, -apple-system, BlinkMacSystemFont, sans-serif)',
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <div
          style={{
            fontSize: '14px',
            fontWeight: '400',
            color: 'var(--color-ink-muted-80, #333333)',
            lineHeight: 1.47,
            marginBottom: '26px',
            fontFamily: 'var(--font-family-body, -apple-system, BlinkMacSystemFont, sans-serif)',
          }}
        >
          {message}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            width: '100%',
          }}
        >
          {/* Batal */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="apple-modal-btn apple-modal-cancel"
            style={{
              padding: '11px 18px',
              borderRadius: 'var(--rounded-pill, 9999px)',
              border: '1px solid var(--color-hairline, #e0e0e0)',
              backgroundColor: 'var(--color-canvas-parchment, #f5f5f7)',
              color: 'var(--color-ink, #1d1d1f)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-family-body, -apple-system, BlinkMacSystemFont, sans-serif)',
              transition: 'background-color 0.15s, transform 0.1s',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {cancelText}
          </button>

          {/* Konfirmasi / Aksi */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="apple-modal-btn apple-modal-confirm"
            style={{
              padding: '11px 18px',
              borderRadius: 'var(--rounded-pill, 9999px)',
              border: 'none',
              backgroundColor: getConfirmBg(),
              color: 'var(--color-on-primary, #ffffff)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-family-body, -apple-system, BlinkMacSystemFont, sans-serif)',
              transition: 'filter 0.15s, transform 0.1s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? (
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'appleSpinner 0.6s linear infinite',
                }}
              />
            ) : null}
            <span>{loading ? 'Memproses…' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppleConfirmModal;
