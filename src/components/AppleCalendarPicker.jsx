import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import './AppleCalendarPicker.css';

/* ──────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────── */
const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format tanggal ke ISO YYYY-MM-DD untuk storage
 */
export const toISODate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

/**
 * Format tanggal untuk tampilan badge: "12 Sep 2026"
 */
export const formatDisplayDate = (isoStr) => {
  if (!isoStr) return null;
  const [y, m, d] = isoStr.split('-').map(Number);
  return `${d} ${MONTHS_ID[m - 1].slice(0, 3)} ${y}`;
};

/**
 * Bangun array sel kalender untuk sebuah bulan (termasuk sel kosong sebelum hari pertama)
 */
const buildCalendarCells = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells = [];

  // Sel kosong sebelum hari pertama (Senin start: 0=Sun → geser)
  for (let i = 0; i < firstDay; i++) {
    cells.push({ type: 'prev', day: daysInPrev - firstDay + 1 + i });
  }
  // Hari-hari bulan ini
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ type: 'current', day: d });
  }
  // Sisa sel untuk memenuhi grid
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ type: 'next', day: d });
  }
  return cells;
};

/* ──────────────────────────────────────────────
   CORE CALENDAR COMPONENT
────────────────────────────────────────────── */
const CalendarCore = ({ value, onChange, onClose, mode = 'popover' }) => {
  const today = new Date();
  const todayISO = toISODate(today);

  const initDate = value ? new Date(value + 'T00:00:00') : today;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [selected, setSelected] = useState(value || null);

  const cells = buildCalendarCells(viewYear, viewMonth);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDate = (year, month, day) => {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelected(iso);
    onChange(iso);
    if (onClose) onClose();
  };

  const applyPreset = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const iso = toISODate(d);
    setSelected(iso);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    onChange(iso);
    if (onClose) onClose();
  };

  const handleDone = () => {
    onChange(selected);
    if (onClose) onClose();
  };

  const handleClear = () => {
    setSelected(null);
    onChange(null);
    if (onClose) onClose();
  };

  const PRESETS = [
    { label: '⚡ Hari Ini', offset: 0 },
    { label: '← Kemarin', offset: -1 },
    { label: '→ Besok', offset: 1 },
    { label: '+3 Hari', offset: 3 },
    { label: '+1 Minggu', offset: 7 },
  ];

  return (
    <>
      {/* Header: Month / Year navigation */}
      <div className="acp-header">
        <button className="acp-nav-btn" onClick={goToPrevMonth} title="Bulan sebelumnya">
          <ChevronLeft size={15} />
        </button>
        <div className="acp-month-year">
          <span className="acp-month-label">{MONTHS_ID[viewMonth]}</span>
          <span className="acp-year-label">{viewYear}</span>
        </div>
        <button className="acp-nav-btn" onClick={goToNextMonth} title="Bulan berikutnya">
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Quick presets */}
      <div className="acp-presets">
        {PRESETS.map(p => (
          <button
            key={p.label}
            className="acp-preset-btn"
            onClick={() => applyPreset(p.offset)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="acp-grid-wrapper">
        <div className="acp-day-headers">
          {DAYS_ID.map(d => (
            <div key={d} className="acp-day-header">{d}</div>
          ))}
        </div>
        <div className="acp-grid">
          {cells.map((cell, idx) => {
            if (cell.type !== 'current') {
              return (
                <div key={idx} className="acp-cell acp-cell--empty acp-cell--other-month">
                  {cell.day}
                </div>
              );
            }
            const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
            const isToday = iso === todayISO;
            const isSelected = iso === selected;
            return (
              <button
                key={idx}
                onClick={() => selectDate(viewYear, viewMonth, cell.day)}
                className={[
                  'acp-cell',
                  isSelected ? 'acp-cell--selected' : '',
                  isToday ? 'acp-cell--today' : '',
                ].join(' ')}
                title={iso}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="acp-footer">
        {selected ? (
          <div className="acp-selected-display">
            <strong>{formatDisplayDate(selected)}</strong>
          </div>
        ) : (
          <div className="acp-selected-display">Belum dipilih</div>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selected && (
            <button className="acp-clear-btn" onClick={handleClear}>Hapus</button>
          )}
          <button
            className="acp-done-btn"
            onClick={handleDone}
            disabled={!selected}
            style={!selected ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
          >
            Simpan
          </button>
        </div>
      </div>
    </>
  );
};

/* ──────────────────────────────────────────────
   POPOVER MODE — used in ProgressGroup header
────────────────────────────────────────────── */
export const AppleCalendarPopover = ({
  value,
  onChange,
  triggerRef,
  onClose,
}) => {
  const popoverRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef?.current) return { top: 0, left: 0 };
    const rect = triggerRef.current.getBoundingClientRect();
    const popW = 300;
    const popH = 360;
    let left = rect.left;
    const right = left + popW;
    if (right > window.innerWidth - 16) {
      left = window.innerWidth - popW - 16;
    }

    let top = rect.bottom + 8;
    if (window.innerHeight - rect.bottom < popH && rect.top > popH) {
      top = rect.top - popH - 8;
    }

    return {
      top: Math.max(8, top),
      left: Math.max(8, left),
    };
  }, [triggerRef]);

  const [position, setPosition] = useState(calculatePosition);

  useEffect(() => {
    setPosition(calculatePosition());
  }, [calculatePosition]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        triggerRef?.current && !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, triggerRef]);

  if (!position.top && !position.left) return null;

  return createPortal(
    <>
      <div className="acp-overlay" onClick={onClose} style={{ background: 'transparent' }} />
      <div
        ref={popoverRef}
        className="acp-popover"
        style={{ top: position.top, left: position.left, position: 'fixed' }}
      >
        <CalendarCore value={value} onChange={onChange} onClose={onClose} mode="popover" />
      </div>
    </>,
    document.body
  );
};

/* ──────────────────────────────────────────────
   INLINE MODE — used inside ActionFormEngine
────────────────────────────────────────────── */
const AppleCalendarPicker = ({
  value,
  onChange,
  label = 'Tanggal Dokumen / Eksekusi',
  placeholder = '+ Pilih tanggal',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '700',
          color: '#374151',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          📅 {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: value
            ? 'linear-gradient(135deg, rgba(0, 113, 227, 0.06) 0%, rgba(99, 102, 241, 0.06) 100%)'
            : '#f8fafc',
          border: `1px solid ${value ? 'rgba(0, 113, 227, 0.35)' : '#e2e8f0'}`,
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.15s ease',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={15} color={value ? '#0071e3' : '#94a3b8'} />
          <span style={{
            fontSize: '13px',
            fontWeight: value ? '600' : '400',
            color: value ? '#0071e3' : '#94a3b8',
          }}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px',
              borderRadius: '50%',
            }}
          >
            <X size={13} />
          </button>
        )}
      </button>

      {/* Inline calendar expanded */}
      {open && (
        <div className="acp-inline" style={{ marginTop: '6px' }}>
          <CalendarCore
            value={value}
            onChange={(v) => { onChange(v); setOpen(false); }}
            onClose={() => setOpen(false)}
            mode="inline"
          />
        </div>
      )}
    </div>
  );
};

export default AppleCalendarPicker;
