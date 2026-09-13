import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AppleModalContext = createContext();

export const useAppleModal = () => useContext(AppleModalContext);

export const AppleModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm' | 'prompt'
    message: '',
    title: '',
    inputValue: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const alert = useCallback((message, title = '') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'alert',
        message,
        title,
        onConfirm: () => {
          setModalState(s => ({ ...s, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(s => ({ ...s, isOpen: false }));
          resolve(true);
        }
      });
    });
  }, []);

  const confirm = useCallback((message, title = '') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'confirm',
        message,
        title,
        onConfirm: () => {
          setModalState(s => ({ ...s, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(s => ({ ...s, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const prompt = useCallback((message, title = '') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'prompt',
        message,
        title,
        inputValue: '',
        onConfirm: (val) => {
          setModalState(s => ({ ...s, isOpen: false }));
          resolve(val);
        },
        onCancel: () => {
          setModalState(s => ({ ...s, isOpen: false }));
          resolve(null);
        }
      });
    });
  }, []);

  // Handle enter and escape keys
  useEffect(() => {
    if (!modalState.isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (modalState.type === 'prompt') {
          // don't prevent default if it's an input? Actually we can submit
          modalState.onConfirm(modalState.inputValue);
        } else {
          e.preventDefault();
          modalState.onConfirm();
        }
      } else if (e.key === 'Escape' && (modalState.type === 'confirm' || modalState.type === 'prompt')) {
        e.preventDefault();
        modalState.onCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState]);

  return (
    <AppleModalContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      {modalState.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999,
          animation: 'appleModalFadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '14px',
            width: '270px',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            animation: 'appleModalPopIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <div style={{ padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {modalState.title && (
                <div style={{ fontSize: '17px', fontWeight: '600', color: '#000', letterSpacing: '-0.4px', lineHeight: '1.3' }}>
                  {modalState.title}
                </div>
              )}
              <div style={{ fontSize: '13px', fontWeight: '400', color: modalState.title ? '#000' : '#000', lineHeight: '1.3', letterSpacing: '-0.1px', marginTop: modalState.title ? '0' : '4px' }}>
                {modalState.message}
              </div>
              {modalState.type === 'prompt' && (
                <div style={{ marginTop: '12px' }}>
                  <input
                    autoFocus
                    type="text"
                    value={modalState.inputValue || ''}
                    onChange={(e) => setModalState(s => ({ ...s, inputValue: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '0.5px solid rgba(0,0,0,0.3)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', borderTop: '0.5px solid rgba(0,0,0,0.2)' }}>
              {(modalState.type === 'confirm' || modalState.type === 'prompt') && (
                <button 
                  onClick={modalState.onCancel}
                  style={{
                    flex: 1, padding: '11px', background: 'transparent', border: 'none',
                    borderRight: '0.5px solid rgba(0,0,0,0.2)',
                    color: '#007AFF', fontSize: '17px', fontWeight: '400',
                    cursor: 'pointer', letterSpacing: '-0.4px',
                    outline: 'none', userSelect: 'none'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={() => modalState.onConfirm(modalState.inputValue)}
                style={{
                  flex: 1, padding: '11px', background: 'transparent', border: 'none',
                  color: '#007AFF', fontSize: '17px', fontWeight: (modalState.type === 'confirm' || modalState.type === 'prompt') ? '600' : '400',
                  cursor: 'pointer', letterSpacing: '-0.4px',
                  outline: 'none', userSelect: 'none'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                OK
              </button>
            </div>
          </div>
          <style>{`
            @keyframes appleModalFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes appleModalPopIn {
              0% { opacity: 0; transform: scale(0.95); }
              100% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </AppleModalContext.Provider>
  );
};
