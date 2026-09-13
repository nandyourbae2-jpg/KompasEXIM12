import React from 'react';
import { getTaskVisuals } from '../utils/themeVisuals';

const AoTaskCard = ({ task, onUpdateStatus, onAddNote, onOpenDetail }) => {
  const visuals = getTaskVisuals(task.status, task.due_date, task.workstream);

  return (
    <div className={`flex flex-col bg-[var(--color-canvas)] rounded-[18px] p-4 transition-transform border ${visuals.color === 'RED' ? 'border-[var(--color-status-danger)] border-opacity-30' : 'border-[var(--color-hairline)]'}`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3 border-b border-[var(--color-hairline)] pb-2">
        <div>
          <div className="font-semibold text-[14px] text-[var(--color-ink)] tracking-tight">{task.invoice_no || task.job_code || 'N/A'}</div>
          <div className="text-[12px] text-[var(--color-ink-muted-48)] mt-0.5">{task.buyer || 'Unknown Buyer'}</div>
        </div>
        <div className="text-right">
          <div className="text-[12px] font-semibold text-[var(--color-ink-muted-80)]">{task.vessel || 'Unknown Vessel'}</div>
          {task.due_date && (
            <div className={`text-[12px] mt-0.5 font-medium ${visuals.color === 'RED' ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-ink-muted-48)]'}`}>
              Due: {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-[11px] font-semibold text-[var(--color-ink-muted-48)] uppercase tracking-wider">{task.workstream}</span>
          <div className="font-medium text-[var(--color-ink)]">{task.task_type}</div>
          {task.description && <div className="text-[14px] text-[var(--color-ink-muted-80)] mt-1 line-clamp-2 leading-relaxed">{task.description}</div>}
        </div>
        <div className="ml-4">
          <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${visuals.classes}`}>
            {task.status}
          </span>
        </div>
      </div>

      {/* Operational Alert (if any) */}
      {task.operational_alerts && (
        <div className="mb-4 bg-[var(--color-status-warning-bg)] border-l-2 border-[var(--color-status-warning)] p-2 text-[12px] text-[var(--color-status-warning)] rounded-r-md">
          <strong>Alert:</strong> {task.operational_alerts}
        </div>
      )}

      {/* Remarks (if any) */}
      {task.remarks && (
        <div className="mb-4 bg-[var(--color-canvas-parchment)] p-2 text-[12px] text-[var(--color-ink-muted-80)] italic rounded-md border border-[var(--color-hairline)]">
          "{task.remarks}"
        </div>
      )}

      {/* Footer / Actions */}
      <div className="flex justify-end gap-2 mt-auto">
        <button 
          onClick={() => onUpdateStatus(task)}
          className="text-[12px] px-3 py-1.5 bg-[var(--color-canvas)] border border-[var(--color-hairline)] text-[var(--color-ink)] rounded-full hover:bg-[var(--color-surface-pearl)] font-medium active:scale-95 transition-transform"
        >
          Update Status
        </button>
        <button 
          onClick={() => onAddNote(task)}
          className="text-[12px] px-3 py-1.5 bg-[var(--color-canvas)] border border-[var(--color-hairline)] text-[var(--color-ink)] rounded-full hover:bg-[var(--color-surface-pearl)] font-medium active:scale-95 transition-transform"
        >
          Tambah Catatan
        </button>
        <button 
          onClick={() => onOpenDetail(task)}
          className="text-[12px] px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-full font-medium active:scale-95 transition-transform shadow-sm"
        >
          Buka Detail Job
        </button>
      </div>

    </div>
  );
};

export default AoTaskCard;
