import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { FileText, AlertOctagon, CheckCircle, X, Check, ArrowRight, ArrowLeft, ChevronRight, File } from 'lucide-react';
import '../Supervisor/AeControlTower.css'; // Might still use some classes

// Helper to format date if needed
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ──────────────────────────────────────────────
   SLIDE-OVER FOR DOCUMENT TIMELINE
────────────────────────────────────────────── */
const SlideOver = ({ open, onClose, title, subtitle, children }) => (
  <>
    {open && (
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(4px)', zIndex: 40 }}
        onClick={onClose}
      />
    )}
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '420px', backgroundColor: '#ffffff',
      boxShadow: '-4px 0 30px rgba(0,0,0,0.1)', zIndex: 50, transform: open ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 6px', fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7a7a7a', textTransform: 'uppercase', letterSpacing: '-0.12px' }}>{subtitle}</p>
          <h2 style={{ margin: 0, fontFamily: '"SF Pro Display", system-ui, sans-serif', fontSize: '28px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '0.196px', lineHeight: 1.14 }}>{title}</h2>
        </div>
        <button onClick={onClose} style={{ background: '#f5f5f7', border: 'none', cursor: 'pointer', color: '#1d1d1f', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        {children}
      </div>
    </div>
  </>
);

const AeDocuments = () => {
  const { user } = useAuthStore();
  const token = user?.token;
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Layering State
  const [viewMode, setViewMode] = useState('JOBS_VIEW'); // 'JOBS_VIEW' | 'DOCUMENTS_VIEW'
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Detail State
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ae/my-documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setDocuments(json.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDocs();
  }, [token]);

  // Grouping documents by Job
  const groupedJobs = useMemo(() => {
    const map = new Map();
    documents.forEach(doc => {
      if (!map.has(doc.job_id)) {
        map.set(doc.job_id, {
          job_id: doc.job_id,
          invoice_no: doc.invoice_no,
          buyer: doc.buyer,
          documents: []
        });
      }
      map.get(doc.job_id).documents.push(doc);
    });
    return Array.from(map.values());
  }, [documents]);

  const handleJobClick = (jobId) => {
    setSelectedJobId(jobId);
    setViewMode('DOCUMENTS_VIEW');
  };

  const handleBackToJobs = () => {
    setViewMode('JOBS_VIEW');
    setSelectedJobId(null);
  };

  const handleDocClick = async (doc) => {
    setSelectedDoc(doc);
    setTimelineLoading(true);
    setTimeline([]);
    try {
      const res = await fetch(`${API_BASE_URL}/ae/documents/${doc.id}/timeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTimeline(json.data);
      } else {
        alert('Failed to load timeline');
      }
    } catch(e) {
      console.error(e);
      alert('Error fetching timeline');
    } finally {
      setTimelineLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', fontFamily: '"SF Pro Text", system-ui, sans-serif', color: '#7a7a7a' }}>Loading Documents...</div>;
  if (error) return <div style={{ padding: '80px', color: '#dc2626', textAlign: 'center', fontFamily: '"SF Pro Text", system-ui, sans-serif' }}>Error: {error}</div>;

  const currentJob = viewMode === 'DOCUMENTS_VIEW' ? groupedJobs.find(j => j.job_id === selectedJobId) : null;

  return (
    <div style={{ backgroundColor: '#f5f5f7', minHeight: '100vh', padding: '48px 32px' }}>
      
      {viewMode === 'JOBS_VIEW' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px', textAlign: 'center' }}>
            <h1 style={{ fontFamily: '"SF Pro Display", system-ui, sans-serif', fontSize: '40px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '0px', margin: '0 0 12px 0' }}>
              Document Control
            </h1>
            <p style={{ fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '21px', fontWeight: 600, color: '#7a7a7a', letterSpacing: '0.231px', margin: 0 }}>
              All active invoices across your assigned jobs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {groupedJobs.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: '#7a7a7a', fontFamily: '"SF Pro Text", system-ui, sans-serif' }}>No active jobs found.</div>
            ) : groupedJobs.map(job => {
              const completedDocs = job.documents.filter(d => d.state === 'COMPLETED' || d.state === 'ORIGINAL').length;
              const totalDocs = job.documents.length;
              const missingDocs = job.documents.filter(d => d.state === 'MISSING').length;
              
              return (
                <div 
                  key={job.job_id} 
                  onClick={() => handleJobClick(job.job_id)}
                  style={{ 
                    backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '18px', padding: '32px',
                    cursor: 'pointer', transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
                    display: 'flex', flexDirection: 'column', height: '100%'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '14px', fontWeight: 600, color: '#0066cc', letterSpacing: '-0.224px', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                      Invoice
                    </p>
                    <h3 style={{ fontFamily: '"SF Pro Display", system-ui, sans-serif', fontSize: '28px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '0.196px', margin: '0 0 8px 0', lineHeight: 1.1 }}>
                      {job.invoice_no}
                    </h3>
                    <p style={{ fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '17px', color: '#7a7a7a', margin: 0, fontWeight: 400, letterSpacing: '-0.374px' }}>
                      {job.buyer}
                    </p>
                  </div>
                  
                  <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '14px', fontWeight: 600, color: '#1d1d1f' }}>
                        {totalDocs} Documents
                      </span>
                      <span style={{ fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '12px', color: missingDocs > 0 ? '#ea580c' : '#7a7a7a' }}>
                        {missingDocs > 0 ? `${missingDocs} Missing` : 'All Available'}
                      </span>
                    </div>
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f5f5f7', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d1d1f'
                    }}>
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'DOCUMENTS_VIEW' && currentJob && (
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          
          <button 
            onClick={handleBackToJobs}
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', color: '#0066cc', 
              fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '17px', fontWeight: 400,
              display: 'flex', alignItems: 'center', gap: '6px', padding: 0, marginBottom: '32px'
            }}
          >
            <ArrowLeft size={18} /> Back to Invoices
          </button>

          <div style={{ marginBottom: '48px' }}>
            <h1 style={{ fontFamily: '"SF Pro Display", system-ui, sans-serif', fontSize: '40px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '0px', margin: '0 0 12px 0' }}>
              {currentJob.invoice_no}
            </h1>
            <p style={{ fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '21px', fontWeight: 600, color: '#7a7a7a', letterSpacing: '0.231px', margin: 0 }}>
              {currentJob.buyer}
            </p>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            {currentJob.documents.map((doc, idx) => {
              const isMissing = doc.state === 'MISSING';
              const isDraft = doc.state === 'DRAFT';
              const isFinal = doc.state === 'FINAL' || doc.state === 'ORIGINAL' || doc.state === 'COMPLETED';
              
              return (
                <div 
                  key={doc.id}
                  onClick={() => handleDocClick(doc)}
                  style={{ 
                    padding: '24px 32px', borderBottom: idx === currentJob.documents.length - 1 ? 'none' : '1px solid #f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                    transition: 'background-color 0.2s', backgroundColor: '#fff'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                      backgroundColor: isFinal ? '#e6f4ea' : isMissing ? '#fef2f2' : '#f8fafc',
                      color: isFinal ? '#16a34a' : isMissing ? '#dc2626' : '#0066cc',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FileText size={24} strokeWidth={1.5} />
                    </div>
                    
                    <div>
                      <h4 style={{ fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '17px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.374px', margin: '0 0 4px 0' }}>
                        {doc.document_name}
                      </h4>
                      <p style={{ fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '14px', color: '#7a7a7a', margin: 0 }}>
                        Version {doc.current_version} • <span style={{ color: isMissing ? '#dc2626' : isFinal ? '#16a34a' : '#1d1d1f' }}>{doc.state}</span>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '12px', fontWeight: 600, color: '#7a7a7a', textTransform: 'uppercase', marginBottom: '4px' }}>Pending Activity</span>
                      <span style={{ fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '14px', color: doc.activity_name ? '#ea580c' : '#1d1d1f', fontWeight: doc.activity_name ? 600 : 400 }}>
                        {doc.activity_name ? `${doc.activity_name} (${doc.activity_status})` : 'None'}
                      </span>
                    </div>
                    <ChevronRight size={20} color="#cccccc" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SlideOver
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.document_name}
        subtitle={`Invoice: ${selectedDoc?.invoice_no}`}
      >
        {timelineLoading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#7a7a7a', fontFamily: '"SF Pro Text", system-ui, sans-serif' }}>Loading timeline...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1 }}>
              {timeline.map((act, index) => {
                const isPast = act.status === 'COMPLETED';
                const isCurrent = act.status === 'IN PROGRESS' || (act.status === 'PENDING' && (index === 0 || timeline[index-1].status === 'COMPLETED'));
                
                return (
                  <div key={act.id} style={{ display: 'flex', gap: '20px', position: 'relative', paddingBottom: index === timeline.length - 1 ? '0' : '32px' }}>
                    {index !== timeline.length - 1 && (
                      <div style={{ position: 'absolute', left: '13px', top: '28px', bottom: '0', width: '2px', backgroundColor: isPast ? '#0066cc' : '#f0f0f0' }} />
                    )}
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                      backgroundColor: isPast ? '#0066cc' : isCurrent ? '#0071e3' : '#fafafc',
                      color: isPast || isCurrent ? '#fff' : '#7a7a7a',
                      border: isPast || isCurrent ? 'none' : '1px solid #e0e0e0',
                      boxShadow: isCurrent ? '0 0 0 3px rgba(0, 102, 204, 0.15)' : 'none'
                    }}>
                      {isPast ? <Check size={14} strokeWidth={3} /> : <span style={{ fontSize: '12px', fontWeight: '600' }}>{act.sequence_order}</span>}
                    </div>
                    <div style={{ paddingTop: '4px' }}>
                      <p style={{ margin: 0, fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '17px', fontWeight: 600, color: isPast || isCurrent ? '#1d1d1f' : '#7a7a7a', letterSpacing: '-0.374px' }}>
                        {act.activity_name}
                      </p>
                      <p style={{ margin: '6px 0 0', fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '14px', color: '#7a7a7a' }}>
                        Status: <strong style={{ color: isPast ? '#0066cc' : isCurrent ? '#ea580c' : '#7a7a7a', fontWeight: 600 }}>{act.status}</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #f0f0f0' }}>
              <button 
                onClick={() => navigate(`/workspace/staff/job-detail/${selectedDoc.job_id}`)}
                style={{ 
                  width: '100%', padding: '14px 28px', backgroundColor: '#0066cc', color: '#ffffff', 
                  borderRadius: '9999px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  gap: '8px', cursor: 'pointer', fontFamily: '"SF Pro Text", system-ui, sans-serif', fontSize: '17px', 
                  fontWeight: 400, transition: 'transform 0.15s ease'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Go to Execution Workspace <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
};

export default AeDocuments;
