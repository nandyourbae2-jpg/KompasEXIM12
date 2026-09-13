import re

file_path = "src/pages/Staff/AeJobDetail.jsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Add Handover States
if "const [handovers, setHandovers] = useState(null);" not in content:
    content = content.replace("const [documents, setDocuments] = useState(null);", "const [documents, setDocuments] = useState(null);\n  const [handovers, setHandovers] = useState(null);\n  const [showHandoverModal, setShowHandoverModal] = useState(false);\n  const [handoverType, setHandoverType] = useState('DRAFT');\n  const [handoverRemarks, setHandoverRemarks] = useState('');\n  const [selectedDocs, setSelectedDocs] = useState([]);\n  const [isHandoverSubmitting, setIsHandoverSubmitting] = useState(false);")

# 2. Add Handover Fetch
if "fetch(`${API_BASE_URL}/ae/jobs/${id}/handovers`" not in content:
    new_fetch_job_detail = """
  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const [jobRes, histRes, chkRes, actionRes, docRes, handoverRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ae/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/history`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/checklist`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/next-action`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/documents`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/handovers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const jobJson = await jobRes.json();
      const histJson = await histRes.json();
      const chkJson = await chkRes.json();
      const actionJson = await actionRes.json();
      const docJson = await docRes.json();
      const handoverJson = await handoverRes.json();

      if (!jobJson.success) throw new Error(jobJson.message || 'Gagal memuat detail job');
      
      setJob(jobJson.data);
      if (histJson.success) setHistory(histJson.data);
      if (chkJson.success) setChecklistData(chkJson.data);
      else setChecklistData(null);
      
      if (actionJson.success) setNextAction(actionJson.data.action);
      if (docJson.success) setDocuments(docJson.data);
      if (handoverJson.success) setHandovers(handoverJson.data);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
"""
    content = re.sub(r'const fetchJobDetail = async \(\) => \{[\s\S]*?finally \{\n\s*setLoading\(false\);\n\s*\}\n\s*\};', new_fetch_job_detail, content)

# 3. Handle Submit Handover function
handle_submit_code = """
  const handleSubmitHandover = async () => {
    if (selectedDocs.length === 0) return alert('Pilih minimal satu dokumen untuk Handover');
    
    setIsHandoverSubmitting(true);
    try {
      const payload = {
        request_id: crypto.randomUUID(),
        handover_type: handoverType,
        remarks: handoverRemarks,
        document_references: selectedDocs.map(d => ({ job_document_id: d }))
      };
      
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/handovers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        // Immediate local state update
        setHandovers(prev => prev ? [data.data, ...prev] : [data.data]);
        setShowHandoverModal(false);
        setHandoverRemarks('');
        setSelectedDocs([]);
      } else {
        alert(data.message || 'Gagal membuat handover');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsHandoverSubmitting(false);
    }
  };
"""
if "const handleSubmitHandover =" not in content:
    content = content.replace("const handleUpdateDocumentActivity = async", handle_submit_code + "\n  const handleUpdateDocumentActivity = async")

# 4. Add UI for Handover Button and Modal, and History Section
ui_header = """
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Job: {job.invoice}</h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#64748b' }}>
              <span>Buyer: {job.buyer}</span>
              <span>Destination: {job.destination}</span>
              <span>ETD: {job.etd || '-'}</span>
              <span>Progress: {job.ae_progress}%</span>
            </div>
          </div>
          <button 
             onClick={() => setShowHandoverModal(true)}
             style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
             Handover to AO
          </button>
        </div>
"""
content = re.sub(r'<div style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\', marginBottom: \'24px\' }}>[\s\S]*?</div>\n\s*</div>', ui_header, content, count=1)


ui_history = """
          {/* Handover History */}
          <div style={{ marginTop: '24px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
             <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#334155' }}>HANDOVER HISTORY (AE -> AO)</h3>
             </div>
             <div style={{ padding: '16px' }}>
                {!handovers || handovers.length === 0 ? (
                   <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Belum ada riwayat handover.</p>
                ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {handovers.map(h => (
                         <div key={h.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                               <strong style={{ color: '#0f172a' }}>{h.handover_type} - {h.event_type}</strong>
                               <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(h.created_at).toLocaleString()}</span>
                            </div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#334155' }}>{h.remarks}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                               {h.documents && h.documents.map(d => (
                                  <span key={d.id} style={{ fontSize: '11px', padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', color: '#475569' }}>
                                     {d.snap_document_name} ({d.snap_document_state})
                                  </span>
                               ))}
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
"""
if "HANDOVER HISTORY (AE -> AO)" not in content:
    content = content.replace("{/* Checklist Area */}", ui_history + "\n          {/* Checklist Area */}")

modal_ui = """
      {/* Handover Modal */}
      {showHandoverModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>Handover to AO</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Tipe Handover</label>
              <select value={handoverType} onChange={(e) => setHandoverType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                <option value="DRAFT">DRAFT</option>
                <option value="FINAL">FINAL</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Pilih Dokumen</label>
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '4px' }}>
                 {documents && documents.map(d => (
                    <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '14px' }}>
                       <input 
                         type="checkbox" 
                         checked={selectedDocs.includes(d.id)} 
                         onChange={(e) => {
                            if (e.target.checked) setSelectedDocs(prev => [...prev, d.id]);
                            else setSelectedDocs(prev => prev.filter(id => id !== d.id));
                         }} 
                       />
                       {d.document_name} ({d.state})
                    </label>
                 ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Keterangan</label>
              <textarea 
                 value={handoverRemarks} 
                 onChange={(e) => setHandoverRemarks(e.target.value)}
                 style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '60px' }}
                 placeholder="Catatan untuk AO..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
               <button onClick={() => setShowHandoverModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Batal</button>
               <button onClick={handleSubmitHandover} disabled={isHandoverSubmitting} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isHandoverSubmitting ? 'Mengirim...' : 'Kirim Handover'}
               </button>
            </div>
          </div>
        </div>
      )}
"""

content = content.replace("</div>\n  );\n};\n\nexport default AeJobDetail;", modal_ui + "\n    </div>\n  );\n};\n\nexport default AeJobDetail;")

with open(file_path, "w") as f:
    f.write(content)
print("AeJobDetail.jsx patched for Handovers.")
