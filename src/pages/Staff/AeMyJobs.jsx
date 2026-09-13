import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Layers, Search } from 'lucide-react';
import '../Supervisor/AeControlTower.css';

const AeMyJobs = () => {
  const { user } = useAuthStore();
  const token = user?.token;
  const navigate = useNavigate();
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const filterParam = query.get('filter');
    if (filterParam) {
       setFilter(filterParam);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ae/my-jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setJobs(json.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchJobs();
  }, [token]);

  if (loading) return <div className="ae-control-tower"><div style={{ padding: '32px', textAlign: 'center' }}>Loading Jobs...</div></div>;
  if (error) return <div className="ae-control-tower"><div style={{ color: 'red', padding: '32px' }}>Error: {error}</div></div>;

  const filteredJobs = jobs.filter(j => {
    let matchesFilter = true;
    if (filter === 'overdue') matchesFilter = j.priority === 'OVERDUE' && j.ae_status !== 'Completed';
    else if (filter === 'active') matchesFilter = j.ae_status !== 'Completed';
    else if (filter === 'completed') matchesFilter = j.ae_status === 'Completed';

    let matchesSearch = true;
    if (search) {
      const s = search.toLowerCase();
      matchesSearch = (j.invoice_no?.toLowerCase().includes(s) || j.buyer?.toLowerCase().includes(s) || j.destination?.toLowerCase().includes(s));
    }

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="ae-control-tower">
      <div className="act-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="act-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={24} color="#3b82f6" /> My Jobs
          </h1>
          <p className="act-subtitle">All assigned jobs and their current operational status.</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setFilter('')} style={{ padding: '8px 16px', borderRadius: '6px', border: filter === '' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: filter === '' ? '#eff6ff' : '#fff', color: filter === '' ? '#1e40af' : '#475569', cursor: 'pointer', fontWeight: 500 }}>All</button>
            <button onClick={() => setFilter('active')} style={{ padding: '8px 16px', borderRadius: '6px', border: filter === 'active' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: filter === 'active' ? '#eff6ff' : '#fff', color: filter === 'active' ? '#1e40af' : '#475569', cursor: 'pointer', fontWeight: 500 }}>Active</button>
            <button onClick={() => setFilter('overdue')} style={{ padding: '8px 16px', borderRadius: '6px', border: filter === 'overdue' ? '2px solid #ef4444' : '1px solid #cbd5e1', background: filter === 'overdue' ? '#fef2f2' : '#fff', color: filter === 'overdue' ? '#991b1b' : '#475569', cursor: 'pointer', fontWeight: 500 }}>Overdue</button>
            <button onClick={() => setFilter('completed')} style={{ padding: '8px 16px', borderRadius: '6px', border: filter === 'completed' ? '2px solid #10b981' : '1px solid #cbd5e1', background: filter === 'completed' ? '#f0fdf4' : '#fff', color: filter === 'completed' ? '#065f46' : '#475569', cursor: 'pointer', fontWeight: 500 }}>Completed</button>
          </div>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input 
              type="text" 
              placeholder="Search Invoice, Buyer..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="act-table" style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>INVOICE</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>BUYER / DESTINATION</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>SCHEDULE (CLOSING / ETD)</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>STATUS / PROGRESS</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>STAGE</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>URGENCY</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>No jobs match your filters.</td>
                </tr>
              ) : filteredJobs.map(job => (
                <tr key={job.id} onClick={() => navigate(`/workspace/staff/job-detail/${job.id}`)} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                    {job.invoice_no || '-'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>{job.buyer || '-'}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{job.destination || '-'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', color: !job.closing_docs ? '#ef4444' : '#334155' }}>Docs: {job.closing_docs || 'MISSING'} {job.closing_docs_time || ''}</div>
                    <div style={{ fontSize: '13px', color: !job.etd ? '#ef4444' : '#64748b', marginTop: '4px' }}>ETD: {job.etd || 'MISSING'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>{job.ae_status || 'Pending'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      {job.progress !== undefined ? `${job.progress}%` : (job.nextAction === 'Checklist not initialized' ? job.nextAction : '0%')}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{job.currentStage}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: job.priority === 'CRITICAL' || job.priority === 'OVERDUE' ? '#ef4444' : '#64748b', padding: '4px 8px', background: job.priority === 'CRITICAL' || job.priority === 'OVERDUE' ? '#fef2f2' : '#f8fafc', borderRadius: '4px' }}>
                      {(!job.closing_docs || !job.etd) ? '-' : job.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AeMyJobs;
