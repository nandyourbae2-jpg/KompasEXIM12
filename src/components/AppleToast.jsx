import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * AppleToast
 *
 * Floating pill-shaped notification banner terinspirasi Apple Dynamic Island / HIG Toast:
 * - Backdrop blur dengan surface frosted glass
 * - Rounded pill (9999px)
 * - SF Pro Typography
 * - Auto-dismiss dengan smooth fade
 */
const AppleToast = ({
  isOpen,
  onClose,
  type = 'success', // 'success' | 'error' | 'info'
  message,
  duration = 3500,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle size={17} color="var(--color-status-danger, #ff3b30)" />;
      case 'info':
        return <Info size={17} color="var(--color-primary, #0066cc)" />;
      case 'success':
      default:
        return <CheckCircle2 size={17} color="var(--color-status-success, #34c759)" />;
    }
  };

  return (
    <aside
      aria-label="Notifikasi sistem"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)',
        borderRadius: 'var(--rounded-pill, 9999px)',
        padding: '9px 18px 9px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '90vw',
        animation: 'appleToastDrop 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: 'var(--font-family-body, -apple-system, BlinkMacSystemFont, sans-serif)',
      }}
    >
      <style>{`
        @keyframes appleToastDrop {
          from {
            opacity: 0;
            transform: translate(-50%, -16px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {getIcon()}
      </div>

      <span
        style={{
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--color-ink, #1d1d1f)',
          letterSpacing: '-0.2px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '380px',
        }}
      >
        {message}
      </span>

      <button
        onClick={onClose}
        aria-label="Tutup notifikasi"
        style={{
          border: 'none',
          background: 'none',
          padding: '2px',
          cursor: 'pointer',
          color: 'var(--color-ink-muted-48, #7a7a7a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '4px',
          borderRadius: '50%',
        }}
      >
        <X size={13} />
      </button>
    </aside>
  );
};

export default AppleToast;
