import React from 'react';
import { useAoStore } from '../store/useAoStore';
import { getTaskVisuals } from '../utils/themeVisuals';

const AoJobDetail = () => {
  const { activeJobDetail } = useAoStore();

  // Expose a way to close the modal by setting activeJobDetail to null.
  // We can do this directly here since useAoStore exposes `setState`, but it's cleaner to use a method if provided.
  // For now, we'll just manipulate the store state.
  const handleClose = () => {
    useAoStore.setState({ activeJobDetail: null });
  };

  if (!activeJobDetail) return null;

  const { context, tasks } = activeJobDetail;

  // Determine aggregated job status (simple derivation: if all completed -> COMPLETED, if any blocked -> BLOCKED, else IN PROGRESS)
  let aggregatedStatus = 'IN PROGRESS';
  if (tasks.length > 0) {
    if (tasks.every(t => t.status === 'COMPLETED')) aggregatedStatus = 'COMPLETED';
    else if (tasks.some(t => t.status === 'BLOCKED')) aggregatedStatus = 'BLOCKED';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-canvas)] w-full max-w-6xl max-h-[90vh] rounded-[18px] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Global Header */}
        <div className="flex justify-between items-center bg-[var(--color-canvas-parchment)] border-b border-[var(--color-hairline)] p-4">
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--color-ink)] tracking-tight">
              {context?.invoice_no || context?.job_code || 'No Reference'}
            </h2>
            <div className="text-[14px] text-[var(--color-ink-muted-48)] mt-1 tracking-tight">
              Buyer: <span className="font-semibold text-[var(--color-ink-muted-80)]">{context?.buyer || '-'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 text-[12px] font-semibold rounded-full ${
              aggregatedStatus === 'COMPLETED' ? 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]' :
              aggregatedStatus === 'BLOCKED' ? 'bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger)]' :
              'bg-[var(--color-status-info-bg)] text-[#0066cc]'
            }`}>
              {aggregatedStatus}
            </span>
            <button 
              onClick={handleClose}
              className="text-[var(--color-ink-muted-48)] hover:text-[var(--color-ink)] font-bold text-xl px-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Area - Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-y-auto bg-[var(--color-canvas)]">
          
          {/* Left Panel (AE Context - Read Only) */}
          <div className="flex flex-col gap-6">
            <div className="bg-[var(--color-canvas-parchment)] p-5 rounded-[18px] border border-[var(--color-hairline)]">
              <h3 className="text-[12px] font-semibold text-[var(--color-ink-muted-80)] uppercase tracking-wider mb-4 border-b border-[var(--color-hairline)] pb-2">Shipment Context</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[14px]">
                <div>
                  <span className="block text-[12px] text-[var(--color-ink-muted-48)]">Destination Port</span>
                  <span className="font-medium text-[var(--color-ink)]">{context?.destination || '-'}</span>
                </div>
                <div>
                  <span className="block text-[12px] text-[var(--color-ink-muted-48)]">Total FCL</span>
                  <span className="font-medium text-[var(--color-ink)]">{context?.total_cont_fcl || '-'}</span>
                </div>
                <div>
                  <span className="block text-[12px] text-[var(--color-ink-muted-48)]">Liner / Vessel</span>
                  <span className="font-medium text-[var(--color-ink)]">{context?.vessel || '-'}</span>
                </div>
                <div>
                  <span className="block text-[12px] text-[var(--color-ink-muted-48)]">ETA</span>
                  <span className="font-medium text-[var(--color-ink)]">{context?.eta ? new Date(context.eta).toLocaleDateString() : '-'}</span>
                </div>
                <div>
                  <span className="block text-[12px] text-[var(--color-ink-muted-48)]">BL NO</span>
                  <span className="font-medium text-[var(--color-ink)]">{context?.bl_no || 'TBA'}</span>
                </div>
              </div>
            </div>

            {/* DSCS Conditionally Rendered Block */}
            {(context?.fishing_gear || context?.ds_date || context?.jml_fv) && (
              <div className="bg-[var(--color-status-info-bg)] p-5 rounded-[18px] border border-[#0066cc] border-opacity-20">
                <h3 className="text-[12px] font-semibold text-[#0066cc] uppercase tracking-wider mb-4 border-b border-[#0066cc] border-opacity-20 pb-2">DSCS Specific Data</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[14px]">
                  <div>
                    <span className="block text-[12px] text-[#0066cc] opacity-80">Fishing Gear</span>
                    <span className="font-medium text-[#0066cc]">{context?.fishing_gear || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[12px] text-[#0066cc] opacity-80">Total FV</span>
                    <span className="font-medium text-[#0066cc]">{context?.jml_fv || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[12px] text-[#0066cc] opacity-80">DSC Date</span>
                    <span className="font-medium text-[#0066cc]">{context?.ds_date ? new Date(context.ds_date).toLocaleDateString() : '-'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel (Interactive Task Timeline) */}
          <div className="bg-[var(--color-canvas)]">
            <h3 className="text-[17px] font-semibold text-[var(--color-ink)] mb-6 tracking-tight">Workstream Timeline</h3>
            <div className="ml-4 border-l border-[var(--color-hairline)] pl-6 relative space-y-8">
              {tasks.length === 0 ? (
                <p className="text-[var(--color-ink-muted-48)] text-[14px]">No tasks tracked for this job.</p>
              ) : (
                tasks.map((task) => {
                  const visuals = getTaskVisuals(task.status, task.due_date, task.workstream);
                  
                  // Simple circle indicator color mapping
                  let dotColor = 'bg-[var(--color-status-neutral)] border-white';
                  let ring = '';
                  if (visuals.color === 'RED') {
                    dotColor = 'bg-[var(--color-status-danger)] border-white';
                  } else if (visuals.color === 'ORANGE') {
                    dotColor = 'bg-[var(--color-status-warning)] border-white';
                    ring = 'ring-4 ring-[var(--color-status-warning-bg)] animate-pulse';
                  } else if (visuals.color === 'GREEN') {
                    dotColor = 'bg-[var(--color-status-success)] border-white';
                  } else if (visuals.color === 'YELLOW') {
                    dotColor = 'bg-[#d97706] border-white';
                  } else if (visuals.color === 'BLUE') {
                    dotColor = 'bg-[#0066cc] border-white';
                  }

                  return (
                    <div key={task.id} className="relative">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[32px] top-2 w-3 h-3 rounded-full border-2 ${dotColor} ${ring}`}></div>
                      
                      {/* Task Content */}
                      <div className={`p-4 rounded-[18px] border ${visuals.classes} shadow-sm`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider opacity-75">{task.workstream}</span>
                            <h4 className="font-semibold text-[14px] mt-0.5 tracking-tight">{task.task_type}</h4>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-1 bg-white bg-opacity-50 rounded-full border border-current">
                            {task.status}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-[14px] mt-2 opacity-90 leading-relaxed">{task.description}</p>
                        )}

                        {task.remarks && (
                          <div className="mt-3 p-2 bg-[var(--color-canvas)] bg-opacity-60 rounded-md text-[12px] italic border border-[var(--color-hairline)] border-opacity-50">
                            💬 "{task.remarks}"
                          </div>
                        )}

                        {/* Audit Trail */}
                        {task.audits && task.audits.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-current border-opacity-10">
                            <h5 className="text-[10px] uppercase font-semibold opacity-70 mb-1 tracking-wider">Audit Trail</h5>
                            <ul className="text-[11px] opacity-80 space-y-1">
                              {task.audits.map((audit, idx) => (
                                <li key={idx}>• {audit.action} by {audit.actor_name} on {new Date(audit.created_at).toLocaleString()}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AoJobDetail;
