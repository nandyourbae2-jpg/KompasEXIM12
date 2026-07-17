import React, { useState, useRef, useEffect } from 'react';
import Badge from './Badge';
import { Trash2, Package } from 'lucide-react';
import useTaskStore from '../store/useTaskStore';
import useAuthStore from '../store/useAuthStore';
import { getUserName } from '../utils/userLookup';

/**
 * TaskCard
 *
 * Kartu tugas individual di Kanban board.
 */
const TaskCard = ({ task, onCardClick, onDeleteClick }) => {
  const { moveTask, updateTaskNotes } = useTaskStore();
  const { user } = useAuthStore();
  const [notesValue, setNotesValue] = useState(task.notes || '');
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setNotesValue(task.notes || '');
  }, [task.notes]);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleNotesChange = (e) => {
    setNotesValue(e.target.value);
    resizeTextarea();
  };

  const handleNotesBlur = () => {
    updateTaskNotes(task.id, notesValue);
  };

  const handleCardClick = (e) => {
    if (
      e.target.closest('[data-notes-area]') ||
      e.target.closest('[data-action-btn]')
    ) return;
    if (onCardClick) onCardClick(task);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDeleteClick) onDeleteClick(task.id);
  };

  const handleMoveClick = (e, direction) => {
    e.stopPropagation();
    moveTask(task.id, direction);
  };

  const disableDelete = task.sumber_tugas === 'ESCALATION' && user?.id !== task.assigned_by_id && user?.level_otoritas !== 'Manager';

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHoveringCard(true)}
      onMouseLeave={() => setIsHoveringCard(false)}
      style={{
        backgroundColor: 'var(--color-canvas)',
        border: isHoveringCard ? '1px solid var(--color-primary)' : '1px solid var(--color-hairline)',
        borderRadius: 'var(--rounded-lg)',
        padding: '16px',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: isHoveringCard ? '0 4px 12px rgba(0,0,0,0.08)' : 'var(--shadow-divider)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxSizing: 'border-box'
      }}
    >
      {/* ── Row 1: ID + Tanggal + Hapus ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', fontWeight: '600' }}>
          {task.id}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {task.dueDate && (
            <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', fontWeight: '500' }}>
              {task.dueDate}
            </span>
          )}

          {(!disableDelete) && (
            <button
              data-action-btn
              onClick={handleDeleteClick}
              onMouseEnter={() => setIsHoveringDelete(true)}
              onMouseLeave={() => setIsHoveringDelete(false)}
              title="Hapus tugas ini"
              style={{
                width: '24px', height: '24px',
                borderRadius: 'var(--rounded-sm)',
                border: 'none',
                backgroundColor: isHoveringDelete ? 'var(--color-status-danger-bg)' : 'transparent',
                color: isHoveringDelete ? 'var(--color-status-danger)' : 'var(--color-ink-muted-48)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                padding: 0,
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Row 2: Judul Task ── */}
      <div style={{
        fontSize: '15px', // body-strong
        fontWeight: '600',
        color: 'var(--color-ink)',
        lineHeight: '1.3',
        letterSpacing: '-0.3px',
        wordBreak: 'break-word'
      }}>
        {task.title}
      </div>

      {/* ── Row 3: Priority + Department + Sumber Tugas Badges ── */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {task.priority && <Badge type="priority" value={task.priority} />}
        {task.department && <Badge type="department" value={task.department} />}
        {task.sumber_tugas && <Badge type="sumber_tugas" value={task.sumber_tugas} />}
      </div>

      {/* ── Row 4: Import Project / Shipment UN Badge ── */}
      {(task.importProjectId || task.shipment_un) && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {task.importProjectId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-canvas-parchment)', padding: '4px 8px', borderRadius: 'var(--rounded-pill)' }}>
              <Package size={12} color="var(--color-ink-muted-80)" />
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>
                {task.importProjectId}
              </span>
            </div>
          )}
          {task.shipment_un && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-canvas-parchment)', padding: '4px 8px', borderRadius: 'var(--rounded-pill)' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>
                {task.shipment_un}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Row 5: Assignee ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            backgroundColor: 'var(--color-surface-chip-translucent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: '700',
            color: 'var(--color-ink)',
            flexShrink: 0,
          }}>
            {task.assigneeId ? getUserName(task.assigneeId).charAt(0).toUpperCase() : '?'}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)', fontWeight: '500' }}>
            {task.assigneeId ? getUserName(task.assigneeId) : 'Belum di-assign'}
          </span>
        </div>
        {task.sumber_tugas === 'ESCALATION' && task.assigned_by_id && (
          <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', paddingLeft: '32px' }}>
            Ditugaskan oleh: {getUserName(task.assigned_by_id)}
          </div>
        )}
      </div>

      {/* ── Row 6: Catatan Progress (note-progress) ── */}
      <div
        data-notes-area
        onClick={(e) => e.stopPropagation()}
      >
        <textarea
          ref={textareaRef}
          value={notesValue}
          onChange={handleNotesChange}
          onBlur={handleNotesBlur}
          onFocus={resizeTextarea}
          placeholder="Tambahkan catatan progres..."
          rows={1}
          style={{
            width: '100%',
            backgroundColor: 'var(--color-annotation-highlight-bg)',
            border: '1px solid var(--color-annotation-highlight-border)',
            borderRadius: 'var(--rounded-sm)',
            padding: '8px 10px',
            fontSize: '12px',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-family-body)',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box',
            overflow: 'hidden',
            cursor: 'text',
            transition: 'border-color 0.15s',
          }}
          onFocusCapture={e => {
            e.target.style.borderColor = 'var(--color-status-warning)';
          }}
          onBlurCapture={e => {
            e.target.style.borderColor = 'var(--color-annotation-highlight-border)';
          }}
        />
      </div>

      {/* ── Row 7: Tombol Navigasi Maju/Mundur (Full Width) ── */}
      <div data-action-btn style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        {task.status !== 'Backlog' && (
          <button
            onClick={(e) => handleMoveClick(e, 'backward')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--rounded-sm)',
              border: '1px solid var(--color-hairline)',
              backgroundColor: 'var(--color-canvas)',
              color: 'var(--color-ink)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas)'}
          >
            ← Mundur
          </button>
        )}
        
        {task.status !== 'Selesai' && (
          <button
            onClick={(e) => handleMoveClick(e, 'forward')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--rounded-sm)',
              border: '1px solid var(--color-hairline)',
              backgroundColor: 'var(--color-canvas)',
              color: 'var(--color-ink)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas)'}
          >
            Lanjut →
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
