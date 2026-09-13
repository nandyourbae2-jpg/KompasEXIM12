import re

file_path = "src/pages/Staff/AeJobDetail.jsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. State for documents
if "const [documents, setDocuments] = useState(null);" not in content:
    content = content.replace("const [checklistData, setChecklistData] = useState(null);", "const [checklistData, setChecklistData] = useState(null);\n  const [documents, setDocuments] = useState(null);")

# 2. Add fetch logic in fetchJobDetail
new_fetch_job_detail = """
  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const [jobRes, histRes, chkRes, actionRes, docRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ae/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/history`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/checklist`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/next-action`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/documents`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const jobJson = await jobRes.json();
      const histJson = await histRes.json();
      const chkJson = await chkRes.json();
      const actionJson = await actionRes.json();
      const docJson = await docRes.json();

      if (!jobJson.success) throw new Error(jobJson.message || 'Gagal memuat detail job');
      
      setJob(jobJson.data);
      if (histJson.success) setHistory(histJson.data);
      if (chkJson.success) setChecklistData(chkJson.data);
      else setChecklistData(null);
      
      if (actionJson.success) setNextAction(actionJson.data.action);
      if (docJson.success) setDocuments(docJson.data);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
"""

content = re.sub(r'const fetchJobDetail = async \(\) => \{[\s\S]*?\};\n', new_fetch_job_detail, content)


# 3. Add handleUpdateDocumentActivity function
handle_doc = """
  const handleUpdateDocumentActivity = async (activityId, newStatus, currentVersion) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/document-activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, version: currentVersion })
      });
      const data = await res.json();
      if (data.success) {
        // Update local state smoothly
        setDocuments(prev => prev.map(doc => doc.id === data.data.id ? data.data : doc));
        
        // Refresh next action
        fetch(`${API_BASE_URL}/ae/jobs/${id}/next-action`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => { if(d.success) setNextAction(d.data.action); });
      } else {
        alert(data.message || 'Gagal update document activity');
      }
    } catch (err) {
      alert(err.message);
    }
  };
"""

content = content.replace("const handleUpdateChecklistStatus = async", handle_doc + "\n  const handleUpdateChecklistStatus = async")


# 4. Insert UI for Documents
doc_ui = """
          {/* Documents Area */}
          <div style={{ marginTop: '24px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
             <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#334155' }}>DOCUMENT ACTIVITIES</h3>
             </div>
             <div style={{ padding: '16px' }}>
                {!documents || documents.length === 0 ? (
                   <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Belum ada aktivitas dokumen untuk job ini.</p>
                ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {documents.map(doc => (
                         <div key={doc.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                               <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>📄 {doc.document_name}</h4>
                               <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#64748b', fontWeight: 600 }}>State: {doc.state}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                               {doc.activities && doc.activities.map(act => (
                                  <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: '#f8fafc', borderRadius: '4px' }}>
                                     <span style={{ fontSize: '13px', color: '#475569' }}>{act.activity_name}</span>
                                     <select 
                                        value={act.status}
                                        onChange={(e) => handleUpdateDocumentActivity(act.id, e.target.value, act.version)}
                                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155', cursor: 'pointer', outline: 'none' }}
                                     >
                                        <option value="PENDING">PENDING</option>
                                        <option value="IN PROGRESS">IN PROGRESS</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                        <option value="NOT APPLICABLE">NOT APPLICABLE</option>
                                        <option value="BLOCKED">BLOCKED</option>
                                     </select>
                                  </div>
                               ))}
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
          
          {/* Checklist Area */}
"""

content = content.replace("{/* Checklist Area */}", doc_ui)

with open(file_path, "w") as f:
    f.write(content)
print("AeJobDetail.jsx patched for Documents.")
