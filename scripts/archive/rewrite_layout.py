import sys
import re

with open('src/pages/Staff/AeJobWorkbench.jsx', 'r') as f:
    content = f.read()

# Replace the layout
old_top_layout_start = """  return (
    <div className="ae-control-tower" style={{ paddingBottom: '64px' }}>
      
"""
old_top_layout_end = """        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flexGrow: 1, minHeight: '100%' }}>"""

old_right_col_start = """        {/* Right Column: Secondary Meta (35%) */}"""
old_right_col_end = """          </div>
          
        </div>
      </div>
    </div>
  );
};"""

# We'll use string replacement to structure it cleanly.
new_layout_header = """  return (
    <div className="ae-control-tower" style={{ paddingBottom: '64px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Top Header: Compact Source Context */}
      <div style={{ background: '#fff', borderRadius: '8px', padding: '16px 24px', marginBottom: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
               <ArrowLeft size={14} /> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
               <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Inv: {job.invoice_no || '-'}</h1>
               <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{job.job_code}</div>
            </div>
         </div>
         
         <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Buyer</span>
               <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>{job.buyer || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Dest</span>
               <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>{job.destination || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Product</span>
               <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>{job.product_type || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Qty FCL</span>
               <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>{job.container_qty || '-'}</span>
            </div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '68% 32%', gap: '24px' }}>
        
        {/* Left Column: Primary Workflow (68%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flexGrow: 1, minHeight: '100%' }}>"""


content = content.replace("""  return (
    <div className="ae-control-tower" style={{ paddingBottom: '64px' }}>
      

      <div style={{ display: 'grid', gridTemplateColumns: '65% 35%', gap: '24px' }}>
        
        {/* Left Column: Primary Workflow (65%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flexGrow: 1, minHeight: '100%' }}>""", new_layout_header)

# Remove the dark Job Context card from right column
right_col_dark = """        {/* Right Column: Secondary Meta (35%) */}
          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', color: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                   <ArrowLeft size={16} /> Back
                </button>
                <div>
                   <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Inv: {job.invoice_no || '-'}</h1>
                   <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 400 }}>{job.job_code}</div>
                </div>
             </div>
             <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <span style={{ background: job.ae_status === 'Completed' ? '#10b981' : '#3b82f6', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{job.ae_status}</span>
                {job.priority !== 'NORMAL' && <span style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{job.priority}</span>}
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <div>
                   <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Customer Context</div>
                   <div style={{ fontSize: '13px', fontWeight: 500 }}>Buyer: {job.buyer || '-'}</div>
                   <div style={{ fontSize: '13px', fontWeight: 500 }}>Dest: {job.destination || '-'} ({job.destination_country || '-'})</div>
                </div>
                <div>
                   <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={14} /> Product & Cargo</div>
                   <div style={{ fontSize: '13px', fontWeight: 500 }}>Type: {job.product_type || '-'}</div>
                   <div style={{ fontSize: '13px', fontWeight: 500 }}>Qty FCL: {job.container_qty || '-'}</div>
                </div>
                <div>
                   <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Schedule (Source)</div>
                   <div style={{ fontSize: '13px', fontWeight: 500, color: !job.closing_docs ? '#f87171' : '#fff' }}>Closing Docs: {job.closing_docs || 'MISSING'}</div>
                   <div style={{ fontSize: '13px', fontWeight: 500, color: !job.etd ? '#f87171' : '#fff' }}>ETD: {job.etd || 'MISSING'}</div>
                </div>
                <div>
                   <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Anchor size={14} /> Routing</div>
                   <div style={{ fontSize: '13px', fontWeight: 500 }}>Liner: {job.liner || '-'}</div>
                   <div style={{ fontSize: '13px', fontWeight: 500 }}>FWD: {job.fwd_trucking || '-'}</div>
                </div>
             </div>
          </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>"""


new_right_col = """        {/* Right Column: Secondary Meta (32%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Compact Job Context */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
             <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Job Context</h2>
             <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ background: job.ae_status === 'Completed' ? '#10b981' : '#3b82f6', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{job.ae_status}</span>
                {job.priority !== 'NORMAL' && <span style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{job.priority}</span>}
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                   <span style={{ fontSize: '13px', color: '#64748b' }}>Closing Docs</span>
                   <span style={{ fontSize: '13px', fontWeight: 600, color: !job.closing_docs ? '#ef4444' : '#0f172a' }}>{job.closing_docs || 'MISSING'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                   <span style={{ fontSize: '13px', color: '#64748b' }}>ETD</span>
                   <span style={{ fontSize: '13px', fontWeight: 600, color: !job.etd ? '#ef4444' : '#0f172a' }}>{job.etd || 'MISSING'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                   <span style={{ fontSize: '13px', color: '#64748b' }}>ETA</span>
                   <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{job.eta || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                   <span style={{ fontSize: '13px', color: '#64748b' }}>Forwarder</span>
                   <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{job.fwd_trucking || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                   <span style={{ fontSize: '13px', color: '#64748b' }}>Liner</span>
                   <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{job.liner || '-'}</span>
                </div>
             </div>
          </div>"""

content = content.replace(right_col_dark, new_right_col)

with open('src/pages/Staff/AeJobWorkbench.jsx', 'w') as f:
    f.write(content)
print("Rewritten Layout")
