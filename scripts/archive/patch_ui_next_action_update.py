import re

file_path = "src/pages/Staff/AeJobDetail.jsx"
with open(file_path, "r") as f:
    content = f.read()

update_code = """
      // Fetch history in background
      fetch(`${API_BASE_URL}/ae/jobs/${id}/history`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if(data.success) setHistory(data.data); });
      
      // Fetch next action in background
      fetch(`${API_BASE_URL}/ae/jobs/${id}/next-action`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if(data.success) setNextAction(data.data.action); });
"""

content = content.replace("""      // Fetch history in background
      fetch(`${API_BASE_URL}/ae/jobs/${id}/history`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if(data.success) setHistory(data.data); });""", update_code)

with open(file_path, "w") as f:
    f.write(content)
print("AeJobDetail.jsx patched for dynamic next action.")
