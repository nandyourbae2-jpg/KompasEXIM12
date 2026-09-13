import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { 
  Search, FileText, Bell, CheckCircle, Clock, 
  AlertCircle, DollarSign, ChevronRight, TrendingUp,
  Activity, CheckCircle2, Wallet, X
} from 'lucide-react';
import Button from '../../../components/Button';
import { api } from '../../../lib/api';

const fmtRupiah = (val) => {
  const n = Number(val) || 0;
  return `IDR ${new Intl.NumberFormat('id-ID').format(n)}`;
};

const FinancialRequestList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api('/financial-request-ledger/by-project');
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // --- Calculations ---
  const pendingVerification = projects.filter(p => p.jumlah_total === 0 || p.jumlah_total > p.jumlah_terisi);
  const readyPayment = projects.filter(p => p.jumlah_total === p.jumlah_terisi && p.jumlah_total > 0);
  const totalTagihan = projects.reduce((sum, p) => sum + (p.total_actual || 0), 0);
  const overdueCount = 0; // Placeholder for overdue logic

  const filteredProjects = projects.filter(p => 
    p.task_unique_number?.toLowerCase().includes(search.toLowerCase()) || 
    p.supplier?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-canvas-parchment)' }}>
      {/* SECTION 1: Workspace Header */}
      <div style={{ padding: '24px 32px 20px', backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: '34px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 4px 0', letterSpacing: '-0.374px' }}>
              Financial Commitment Workspace
            </h1>
            <p style={{ margin: 0, color: 'var(--color-ink-muted-80)', fontSize: '13px', fontWeight: '500' }}>
              Depo konsolidasi biaya Departemen Import. Teruskan tagihan langsung ke Monitoring Pembayaran.
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--color-canvas)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 'var(--rounded-pill)',
            padding: '8px 16px',
            width: '320px',
          }}>
            <Search size={16} color="var(--color-ink-muted-48)" />
            <input
              type="text"
              placeholder="Cari Task No, Supplier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '13px',
                fontFamily: 'var(--font-family-body)',
                backgroundColor: 'transparent',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
      {error && (
        <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', fontWeight: '500' }}>
          {error}
        </div>
      )}

      {/* SECTION 2: Today's Summary (KPI Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {/* KPI 1 */}
        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: '20px', border: '1px solid var(--color-hairline)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#E0E7FF', padding: '10px', borderRadius: '12px' }}>
              <Clock size={20} color="#4F46E5" />
            </div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>Waiting Verification</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-ink)', letterSpacing: '-1px' }}>{pendingVerification.length}</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-ink-muted-48)' }}>projects</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: '20px', border: '1px solid var(--color-hairline)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#DCFCE7', padding: '10px', borderRadius: '12px' }}>
              <CheckCircle2 size={20} color="#16A34A" />
            </div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>Ready For Payment</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-ink)', letterSpacing: '-1px' }}>{readyPayment.length}</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-ink-muted-48)' }}>projects</span>
          </div>
        </div>

        {/* KPI 3: Total Tagihan */}
        <div style={{ backgroundColor: 'var(--color-canvas)', padding: '20px', borderRadius: '20px', border: '1px solid var(--color-hairline)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#FEF3C7', padding: '10px', borderRadius: '12px' }}>
              <Wallet size={20} color="#D97706" />
            </div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--color-ink-muted-80)' }}>Total Tagihan (Actual)</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-ink)', letterSpacing: '-1px' }}>{fmtRupiah(totalTagihan)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px' }}>
        
        {/* SECTION 4: My Active Commitments */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', margin: 0 }}>Active Projects</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted-48)', cursor: 'pointer' }}>All</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', cursor: 'pointer', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '12px' }}>Active</span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>Memuat data...</div>
          ) : filteredProjects.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', backgroundColor: 'var(--color-canvas)', borderRadius: '20px', border: '1px dashed var(--color-hairline)' }}>
              <FileText size={32} color="var(--color-ink-muted-48)" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)' }}>No Commitments Found</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>You are all caught up.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredProjects.map(p => {
                const total = p.jumlah_total || 0;
                const terisi = p.jumlah_terisi || 0;
                const progressPct = total > 0 ? Math.round((terisi / total) * 100) : 0;
                const isComplete = total > 0 && terisi === total;
                const variance = (p.total_baseline || 0) - (p.total_actual || 0);
                const isOverBudget = variance < 0;

                return (
                  <div 
                    key={p.import_project_id} 
                    onClick={() => navigate(`/workspace/financial-request/${p.import_project_id}`)}
                    style={{ 
                      backgroundColor: 'var(--color-canvas)', 
                      borderRadius: '16px', 
                      padding: '20px', 
                      border: '1px solid var(--color-hairline)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-hairline)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.01)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: isComplete ? '#DCFCE7' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isComplete ? <CheckCircle size={20} color="#16A34A" /> : <Activity size={20} color="var(--color-ink-muted-80)" />}
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>{p.task_unique_number}</h3>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-ink-muted-80)', fontWeight: '500' }}>Supplier: {p.supplier || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: isComplete ? '#DCFCE7' : '#FEF3C7', color: isComplete ? '#166534' : '#92400E', padding: '4px 12px', borderRadius: '12px' }}>
                          {isComplete ? 'Ready' : 'Pending Verification'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--color-hairline)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '48px', flex: 1 }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Tagihan</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>{fmtRupiah(p.total_actual || 0)}</div>
                        </div>

                        <div style={{ flex: 1, maxWidth: '240px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)', fontWeight: '600' }}>Verification Progress</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-ink)', fontWeight: '700' }}>{terisi} of {total}</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: isComplete ? '#16A34A' : 'var(--color-primary)', borderRadius: '4px', transition: 'width 0.5s ease-out' }} />
                          </div>
                        </div>
                      </div>
                      
                      <button style={{ 
                        backgroundColor: 'transparent', color: 'var(--color-primary)', border: 'none', 
                        fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', 
                        cursor: 'pointer', padding: '6px 12px', borderRadius: '16px', transition: 'background 0.2s' 
                      }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Detail <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Today's Action Center */}
        <div style={{ width: '320px' }}>
          <div style={{ backgroundColor: 'var(--color-canvas)', borderRadius: '20px', border: '1px solid var(--color-hairline)', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', position: 'sticky', top: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 16px 0' }}>Action Center</h2>
            
            {pendingVerification.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>No pending actions required.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingVerification.slice(0, 5).map(p => (
                  <div key={p.import_project_id} style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '12px', cursor: 'pointer', border: '1px solid transparent' }} onClick={() => navigate(`/workspace/financial-request/${p.import_project_id}`)} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-hairline)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B', marginTop: '6px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '2px' }}>Verify {p.task_unique_number}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-80)', lineHeight: '1.4' }}>Missing {p.jumlah_total - p.jumlah_terisi} actual verifications</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
      </div>

      {/* Render the detail panel if the route matches */}
      <Outlet />
    </div>
  );
};

export default FinancialRequestList;
