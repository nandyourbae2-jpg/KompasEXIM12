import React, { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle, Clock, CheckCircle2, ChevronRight, FileText, AlertCircle } from 'lucide-react';
import { useAoStore } from '../../../store/useAoStore';

const STAGES = ['PREPARATION', 'DRAFT', 'FINAL_DRAFT', 'ORIGINAL', 'SUBMIT_BANK'];
const STAGE_LABELS = {
  PREPARATION: '1. Email Draft',
  DRAFT: '2. Draft (Ori)',
  FINAL_DRAFT: '3. Telex',
  ORIGINAL: '4. Courier',
  SUBMIT_BANK: '5. Submit Bank'
};

const STAGE_COLORS = {
  PREPARATION: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', activeBg: '#e2e8f0' },
  DRAFT: { bg: '#fef3c7', color: '#d97706', border: '#fde68a', activeBg: '#fef3c7' },
  FINAL_DRAFT: { bg: '#e0f2fe', color: '#0284c7', border: '#bae6fd', activeBg: '#e0f2fe' },
  ORIGINAL: { bg: '#ede9fe', color: '#7c3aed', border: '#ddd6fe', activeBg: '#ede9fe' },
  SUBMIT_BANK: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', activeBg: '#dcfce7' },
};

const AoDocumentStagesMonitor = () => {
  const { stagesMonitoring, aoStaffList } = useAoStore();
  const [search, setSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  const filteredJobs = useMemo(() => {
    let list = stagesMonitoring || [];
    
    if (selectedStaff !== 'ALL') {
      list = list.filter(j => String(j.ao_assignee_id) === String(selectedStaff));
    }
    
    if (selectedStage !== 'ALL') {
      list = list.filter(j => (j.document_stage || 'PREPARATION') === selectedStage);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j => 
        (j.invoice_no || '').toLowerCase().includes(q) ||
        (j.buyer || '').toLowerCase().includes(q) ||
        (j.vessel || '').toLowerCase().includes(q)
      );
    }
    
    if (selectedDate) {
      list = list.filter(j => {
        if (selectedStage !== 'ALL') {
          // If a specific stage is selected, match against its specific date
          if (selectedStage === 'PREPARATION' && (j.email_draft_date || '').startsWith(selectedDate)) return true;
          if (selectedStage === 'DRAFT' && (j.email_ori_date || '').startsWith(selectedDate)) return true;
          if (selectedStage === 'FINAL_DRAFT' && (j.telex_date || '').startsWith(selectedDate)) return true;
          if (selectedStage === 'ORIGINAL' && (j.courier_date || '').startsWith(selectedDate)) return true;
          if (selectedStage === 'SUBMIT_BANK' && (j.submit_bank_date || '').startsWith(selectedDate)) return true;
          return false;
        } else {
          // Match against any of the 5 dates
          return (j.email_draft_date || '').startsWith(selectedDate) ||
                 (j.email_ori_date || '').startsWith(selectedDate) ||
                 (j.telex_date || '').startsWith(selectedDate) ||
                 (j.courier_date || '').startsWith(selectedDate) ||
                 (j.submit_bank_date || '').startsWith(selectedDate);
        }
      });
    }

    return list;
  }, [stagesMonitoring, selectedStaff, selectedStage, search, selectedDate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Cari Invoice, Buyer, Kapal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        
        <select
          value={selectedStaff}
          onChange={e => setSelectedStaff(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', outline: 'none' }}
        >
          <option value="ALL">Semua Staf AO</option>
          {aoStaffList.map(s => (
            <option key={s.id} value={s.id}>{s.nama}</option>
          ))}
        </select>
        
        <select
          value={selectedStage}
          onChange={e => setSelectedStage(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', outline: 'none' }}
        >
          <option value="ALL">Semua Tahapan</option>
          {STAGES.map(s => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>
        
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', outline: 'none', color: selectedDate ? '#0f172a' : '#94a3b8' }}
        />
        {selectedDate && (
          <button 
            onClick={() => setSelectedDate('')}
            style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '12px', textDecoration: 'underline' }}
          >
            Clear Date
          </button>
        )}
      </div>
      
      {/* List */}
      {filteredJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          <FileText size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#475569' }}>Tidak ada pekerjaan yang cocok</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Coba sesuaikan filter pencarian.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredJobs.map(job => {
            const currentStage = job.document_stage || 'PREPARATION';
            const stageIndex = STAGES.indexOf(currentStage);
            
            return (
              <div key={job.id} style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                        #{job.invoice_no}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {job.ao_assignee_name || 'Unassigned'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                      {job.buyer || '—'} · {job.vessel || '—'}
                    </div>
                  </div>
                  
                  {/* Current Action Chip */}
                  {job.current_action && (
                    <div style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', padding: '4px 10px', borderRadius: '8px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={job.current_action}>
                      Action: {job.current_action}
                    </div>
                  )}
                </div>
                
                {/* Progress Strip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {STAGES.map((stg, idx) => {
                    const isCompleted = idx < stageIndex;
                    const isActive = idx === stageIndex;
                    const isFuture = idx > stageIndex;
                    const colors = STAGE_COLORS[stg];
                    
                    return (
                      <React.Fragment key={stg}>
                        <div style={{
                          flex: isActive ? '1.5' : '1',
                          height: '32px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isActive ? colors.activeBg : (isCompleted ? '#f8fafc' : '#ffffff'),
                          border: `1.5px solid ${isActive ? colors.border : (isCompleted ? '#e2e8f0' : '#f1f5f9')}`,
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {isActive && (
                            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)' }} />
                          )}
                          <span style={{
                            fontSize: '10px',
                            fontWeight: isActive ? '800' : '600',
                            color: isActive ? colors.color : (isCompleted ? '#94a3b8' : '#cbd5e1'),
                            zIndex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {isCompleted && <CheckCircle size={10} />}
                            {STAGE_LABELS[stg]}
                          </span>
                        </div>
                        {idx < STAGES.length - 1 && (
                          <ChevronRight size={14} style={{ color: (idx < stageIndex) ? '#94a3b8' : '#e2e8f0', flexShrink: 0 }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AoDocumentStagesMonitor;
