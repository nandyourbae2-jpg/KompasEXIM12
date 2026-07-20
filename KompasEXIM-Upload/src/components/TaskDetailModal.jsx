import React from 'react';
import { X, Clock, Package } from 'lucide-react';
import Badge from './Badge';
import useImportProjectStore from '../store/useImportProjectStore';
import { getUserName } from '../utils/userLookup';

// ─── Helper ──────────────────────────────────────────────────────────────────
const formatTimestamp = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Warna bullet timeline berdasarkan status tujuan
const statusColor = (status) => {
  const map = {
    Backlog: 'var(--color-ink-muted-48)',
    'Akan Dikerjakan': 'var(--color-badge-medium-prd)',
    'Dalam Proses': 'var(--color-status-warning)',
    Review: 'var(--color-dept-ae)',
    Selesai: 'var(--color-status-success)',
  };
  return map[status] || 'var(--color-ink-muted-48)';
};

// ─── Component ────────────────────────────────────────────────────────────────
const TaskDetailModal = ({ task, onClose }) => {
  const getProjectById = useImportProjectStore(s => s.getProjectById);
  const importProject = getProjectById(task?.importProjectId);

  if (!task) return null;

  // Tampilkan histori dari yang TERBARU ke TERLAMA
  const sortedHistory = [...(task.statusHistory || [])].reverse();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 1100,
        }}
      />

      {/* Modal Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1101,
          width: '480px',
          maxWidth: 'calc(100vw - 48px)',
          maxHeight: '80vh',
          backgroundColor: 'var(--color-canvas)',
          borderRadius: 'var(--rounded-lg)',
          boxShadow: 'var(--shadow-product)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', fontWeight: '600', marginBottom: '4px' }}>
              {task.id}
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '-0.374px',
              color: 'var(--color-ink)',
              lineHeight: 1.3,
            }}>
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px',
              borderRadius: '50%',
              border: '1px solid var(--color-hairline)',
              backgroundColor: 'var(--color-canvas-parchment)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              marginLeft: '16px',
            }}
          >
            <X size={16} color="var(--color-ink-muted-80)" />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* Info Row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '20px',
          }}>
            <Badge type="priority" value={task.priority} />
            <Badge type="department" value={task.department} />
            {task.dueDate && (
              <span style={{
                fontSize: '12px',
                color: 'var(--color-ink-muted-48)',
                backgroundColor: 'var(--color-canvas-parchment)',
                border: '1px solid var(--color-hairline)',
                borderRadius: 'var(--rounded-pill)',
                padding: '3px 10px',
                fontWeight: '500',
              }}>
                Tenggat: {task.dueDate}
              </span>
            )}
            {task.assigneeId && (
              <span style={{
                fontSize: '12px',
                color: 'var(--color-ink-muted-48)',
                backgroundColor: 'var(--color-canvas-parchment)',
                border: '1px solid var(--color-hairline)',
                borderRadius: 'var(--rounded-pill)',
                padding: '3px 10px',
                fontWeight: '500',
              }}>
                PIC: {getUserName(task.assigneeId)}
              </span>
            )}
            {task.sumber_tugas === 'ESCALATION' && task.assigned_by_id && (
              <span style={{
                fontSize: '12px',
                color: 'var(--color-ink-muted-48)',
                backgroundColor: 'var(--color-canvas-parchment)',
                border: '1px solid var(--color-hairline)',
                borderRadius: 'var(--rounded-pill)',
                padding: '3px 10px',
                fontWeight: '500',
              }}>
                Ditugaskan oleh: {getUserName(task.assigned_by_id)}
              </span>
            )}
          </div>

          {/* Import Project Info */}
          {importProject && (
            <div style={{
              backgroundColor: 'var(--color-status-info-bg)',
              border: '1px solid var(--color-primary)',
              borderRadius: 'var(--rounded-sm)',
              padding: '10px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Package size={14} color="var(--color-primary)" />
              <div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)' }}>
                  {importProject.id}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', marginLeft: '6px' }}>
                  {importProject.supplier} · {importProject.importType}
                </span>
              </div>
            </div>
          )}

          {/* Catatan Progress (read-only view di modal) */}
          {task.notes && (
            <div style={{
              backgroundColor: 'var(--color-annotation-highlight-bg)',
              border: '1px solid var(--color-annotation-highlight-border)',
              borderRadius: 'var(--rounded-sm)',
              padding: '8px 10px',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-ink-muted-48)', marginBottom: '4px' }}>
                CATATAN PROGRES
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.5 }}>
                {task.notes}
              </div>
            </div>
          )}

          {/* ── Timeline Riwayat Status ── */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '16px',
            }}>
              <Clock size={15} color="var(--color-ink-muted-48)" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Riwayat Perubahan Status
              </span>
            </div>

            {sortedHistory.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)' }}>
                Belum ada riwayat.
              </p>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Garis vertikal penghubung */}
                <div style={{
                  position: 'absolute',
                  left: '7px',
                  top: '14px',
                  bottom: '14px',
                  width: '1px',
                  backgroundColor: 'var(--color-hairline)',
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {sortedHistory.map((entry, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '6px 0',
                    }}>
                      {/* Bullet */}
                      <div style={{
                        width: '15px',
                        height: '15px',
                        borderRadius: '50%',
                        backgroundColor: statusColor(entry.status),
                        flexShrink: 0,
                        marginTop: '2px',
                        border: '2px solid var(--color-canvas)',
                        boxSizing: 'border-box',
                        zIndex: 1,
                        position: 'relative',
                      }} />

                      {/* Teks */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--color-ink)',
                          lineHeight: 1.3,
                        }}>
                          {entry.label}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--color-ink-muted-48)',
                          marginTop: '2px',
                        }}>
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDetailModal;
