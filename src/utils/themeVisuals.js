import { isOverdue, isToday } from './dateHelpers';

export const getTaskVisuals = (status, dueDate, workstream) => {
  if (status === 'BLOCKED' || (status !== 'COMPLETED' && isOverdue(dueDate))) {
    return {
      color: 'RED',
      classes: 'bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger)] border border-[var(--color-status-danger)] border-opacity-20'
    };
  }
  
  if (isToday(dueDate) && status !== 'COMPLETED') {
    return {
      color: 'ORANGE',
      classes: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)] border border-[var(--color-status-warning)] border-opacity-20'
    };
  }
  
  if (status === 'WAITING') {
    return {
      color: 'YELLOW',
      classes: 'bg-[var(--color-annotation-highlight-bg)] text-yellow-800 border border-[var(--color-annotation-highlight-border)] border-opacity-50'
    };
  }
  
  if (status === 'COMPLETED') {
    return {
      color: 'GREEN',
      classes: 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)] border border-[var(--color-status-success)] border-opacity-20'
    };
  }
  
  if (workstream === 'DSCS') {
    return {
      color: 'BLUE',
      classes: 'bg-[var(--color-status-info-bg)] text-[#0066cc] border border-[#0066cc] border-opacity-20'
    };
  }

  // Default / Pending
  return {
    color: 'GRAY',
    classes: 'bg-[var(--color-status-neutral-bg)] text-[var(--color-status-neutral)] border border-gray-200'
  };
};
