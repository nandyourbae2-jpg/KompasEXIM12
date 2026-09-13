import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({
  options = [],
  value = '',
  onChange,
  onBlur,
  placeholder = 'Pilih...',
  searchable = true,
  allowCustom = false,
  disabled = false,
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Normalize options into { label, value } objects
  const normalizedOptions = (options || []).map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { label: opt.label ?? opt.name ?? opt.nama ?? String(opt.value), value: opt.value };
    }
    return { label: String(opt), value: String(opt) };
  });

  // Find currently selected option label
  const selectedOpt = normalizedOptions.find(o => String(o.value) === String(value));
  const currentLabel = selectedOpt ? selectedOpt.label : (allowCustom ? value : '');

  useEffect(() => {
    if (!allowCustom) {
      setSearch(selectedOpt ? selectedOpt.label : '');
    } else {
      setSearch(value || '');
    }
  }, [value, selectedOpt, allowCustom]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (isOpen) {
          setIsOpen(false);
          if (onBlur) onBlur();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onBlur]);

  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes((search || '').toLowerCase())
  );

  const handleSelect = (opt) => {
    onChange(opt.value);
    setSearch(opt.label);
    setIsOpen(false);
    if (onBlur) onBlur();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (allowCustom) {
      onChange(val);
    }
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: '120px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {allowCustom ? (
          <input
            type="text"
            disabled={disabled}
            value={search}
            onChange={handleInputChange}
            onFocus={() => !disabled && setIsOpen(true)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '8px 30px 8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--color-hairline)',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: disabled ? 'var(--color-canvas-parchment)' : 'var(--color-canvas)',
              color: 'var(--color-ink)',
              cursor: disabled ? 'not-allowed' : 'text',
              ...style
            }}
          />
        ) : (
          <div
            onClick={() => !disabled && setIsOpen(!isOpen)}
            style={{
              width: '100%',
              padding: '8px 30px 8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--color-hairline)',
              fontSize: '13px',
              backgroundColor: disabled ? 'var(--color-canvas-parchment)' : 'var(--color-canvas)',
              color: currentLabel ? 'var(--color-ink)' : 'var(--color-ink-muted-48)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              boxSizing: 'border-box',
              ...style
            }}
          >
            {currentLabel || placeholder}
          </div>
        )}
        <ChevronDown
          size={14}
          style={{
            position: 'absolute',
            right: '10px',
            pointerEvents: 'none',
            color: 'var(--color-ink-muted-48)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s'
          }}
        />
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            maxHeight: '160px',
            overflowY: 'auto',
            backgroundColor: 'var(--color-canvas)',
            border: '1px solid var(--color-hairline)',
            borderRadius: '8px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            zIndex: 99999,
            padding: '4px 0'
          }}
        >
          {searchable && !allowCustom && normalizedOptions.length > 5 && (
            <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-hairline)' }}>
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari..."
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  fontSize: '12px',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: '4px',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: 'var(--color-ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    backgroundColor: isSelected ? 'var(--color-status-info-bg)' : 'transparent',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected ? 'var(--color-status-info-bg)' : 'transparent';
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} color="var(--color-primary)" />}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>
              {allowCustom ? 'Ketik item baru...' : 'Tidak ada pilihan'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
