import sys

with open('src/pages/Staff/AeJobWorkbench.jsx', 'r') as f:
    lines = f.readlines()

new_content = []
i = 0
while i < len(lines):
    line = lines[i]
    
    if "{/* Top Header: Read-Only Source Context */}" in line:
        # Skip until the end of the top header
        while "</div>" not in lines[i] or "gridTemplateColumns: '65% 35%'" not in lines[i+2]:
            i += 1
        # Skip the closing div and the blank lines
        i += 1
        continue
        
    if "{/* Right Column: Secondary Meta (35%) */}" in line:
        new_content.append(line)
        new_content.append("          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', color: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>\n")
        new_content.append("             <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>\n")
        new_content.append("                <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>\n")
        new_content.append("                   <ArrowLeft size={16} /> Back\n")
        new_content.append("                </button>\n")
        new_content.append("                <div>\n")
        new_content.append("                   <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Inv: {job.invoice_no || '-'}</h1>\n")
        new_content.append("                   <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 400 }}>{job.job_code}</div>\n")
        new_content.append("                </div>\n")
        new_content.append("             </div>\n")
        
        new_content.append("             <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>\n")
        new_content.append("                <span style={{ background: job.ae_status === 'Completed' ? '#10b981' : '#3b82f6', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{job.ae_status}</span>\n")
        new_content.append("                {job.priority !== 'NORMAL' && <span style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{job.priority}</span>}\n")
        new_content.append("             </div>\n")
        
        new_content.append("             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>\n")
        new_content.append("                <div>\n")
        new_content.append("                   <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Customer Context</div>\n")
        new_content.append("                   <div style={{ fontSize: '13px', fontWeight: 500 }}>Buyer: {job.buyer || '-'}</div>\n")
        new_content.append("                   <div style={{ fontSize: '13px', fontWeight: 500 }}>Dest: {job.destination || '-'} ({job.destination_country || '-'})</div>\n")
        new_content.append("                </div>\n")
        new_content.append("                <div>\n")
        new_content.append("                   <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={14} /> Product & Cargo</div>\n")
        new_content.append("                   <div style={{ fontSize: '13px', fontWeight: 500 }}>Type: {job.product_type || '-'}</div>\n")
        new_content.append("                   <div style={{ fontSize: '13px', fontWeight: 500 }}>Qty FCL: {job.container_qty || '-'}</div>\n")
        new_content.append("                </div>\n")
        new_content.append("                <div>\n")
        new_content.append("                   <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Schedule (Source)</div>\n")
        new_content.append("                   <div style={{ fontSize: '13px', fontWeight: 500, color: !job.closing_docs ? '#f87171' : '#fff' }}>Closing Docs: {job.closing_docs || 'MISSING'}</div>\n")
        new_content.append("                   <div style={{ fontSize: '13px', fontWeight: 500, color: !job.etd ? '#f87171' : '#fff' }}>ETD: {job.etd || 'MISSING'}</div>\n")
        new_content.append("                </div>\n")
        new_content.append("                <div>\n")
        new_content.append("                   <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Anchor size={14} /> Routing</div>\n")
        new_content.append("                   <div style={{ fontSize: '13px', fontWeight: 500 }}>Liner: {job.liner || '-'}</div>\n")
        new_content.append("                   <div style={{ fontSize: '13px', fontWeight: 500 }}>FWD: {job.fwd_trucking || '-'}</div>\n")
        new_content.append("                </div>\n")
        new_content.append("             </div>\n")
        new_content.append("          </div>\n\n")
        i += 1
        continue
    
    new_content.append(line)
    i += 1

with open('src/pages/Staff/AeJobWorkbench.jsx', 'w') as f:
    f.writelines(new_content)
print("Updated Layout.")
