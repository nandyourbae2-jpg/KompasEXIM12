import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const SlideOver = ({ isOpen, onClose, title, subtitle, children, width = '500px' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      pointerEvents: isOpen ? 'auto' : 'none',
      visibility: isOpen ? 'visible' : 'hidden',
      transition: 'visibility 0.3s ease'
    }}>
      {/* Backdrop */}
      <div 
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
          backdropFilter: 'blur(2px)'
        }}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        style={{
          position: 'absolute',
          top: 0, right: 0, bottom: 0,
          width: width,
          maxWidth: '100vw',
          backgroundColor: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{title}</h2>
            {subtitle && <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              color: '#94a3b8',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SlideOver;
