import re

file_path = "src/pages/Staff/AeJobDetail.jsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Add state for nextAction
if "const [nextAction, setNextAction] = useState(null);" not in content:
    content = content.replace("const [checklistData, setChecklistData] = useState(null);", "const [checklistData, setChecklistData] = useState(null);\n  const [nextAction, setNextAction] = useState(null);")

# 2. Fetch next action in fetchJobDetail
if "/ae/jobs/${id}/next-action" not in content:
    content = content.replace("fetch(`${API_BASE_URL}/ae/jobs/${id}/checklist`, { headers: { Authorization: `Bearer ${token}` } })", "fetch(`${API_BASE_URL}/ae/jobs/${id}/checklist`, { headers: { Authorization: `Bearer ${token}` } }),\n        fetch(`${API_BASE_URL}/ae/jobs/${id}/next-action`, { headers: { Authorization: `Bearer ${token}` } })")
    
    content = content.replace("const chkJson = await chkRes.json();", "const chkJson = await chkRes.json();\n      const actionRes = await Promise.resolve(arguments[0][3] || (await Promise.all([fetch(`${API_BASE_URL}/ae/jobs/${id}/next-action`, { headers: { Authorization: `Bearer ${token}` } })]))[0]);\n      const actionJson = await actionRes.json();")

# Actually, replacing the Promise.all is fragile. Let's rewrite fetchJobDetail cleanly.
import textwrap

new_fetch_job_detail = """
  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const [jobRes, histRes, chkRes, actionRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ae/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/history`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/checklist`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ae/jobs/${id}/next-action`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const jobJson = await jobRes.json();
      const histJson = await histRes.json();
      const chkJson = await chkRes.json();
      const actionJson = await actionRes.json();

      if (!jobJson.success) throw new Error(jobJson.message || 'Gagal memuat detail job');
      
      setJob(jobJson.data);
      if (histJson.success) setHistory(histJson.data);
      if (chkJson.success) setChecklistData(chkJson.data);
      else setChecklistData(null);
      
      if (actionJson.success) setNextAction(actionJson.data.action);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
"""

# replace entire fetchJobDetail function
content = re.sub(r'const fetchJobDetail = async \(\) => \{[\s\S]*?\};\n', new_fetch_job_detail, content)

# 3. Add Next Action UI after Job Overview
next_action_ui = """
          {/* Next Action Box */}
          {nextAction && (
            <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '20px', borderLeft: '4px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '50%', color: '#3b82f6' }}>
                <Activity size={24} />
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Action Required</span>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginTop: '4px' }}>{nextAction}</div>
              </div>
            </div>
          )}
          
          {/* Checklist Area */}
"""

content = content.replace("{/* Checklist Area */}", next_action_ui)

with open(file_path, "w") as f:
    f.write(content)
print("AeJobDetail.jsx patched.")
