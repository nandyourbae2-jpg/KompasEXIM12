import sys

with open('src/pages/Staff/AeJobWorkbench.jsx', 'r') as f:
    content = f.read()

target = """  const handleActionComplete = async (activityId, result, evidence, remark) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/actions/${activityId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ result, evidence_payload: evidence, remark })
      });"""

replacement = """  const handleActionComplete = async (activityId, result, evidence, payload) => {
    try {
      // payload contains { remark, ...otherFields } from ActionFormEngine
      const res = await fetch(`${API_BASE_URL}/ae/jobs/${id}/actions/${activityId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ result, evidence_payload: evidence, remark: payload?.remark || '', payload })
      });"""

content = content.replace(target, replacement)

with open('src/pages/Staff/AeJobWorkbench.jsx', 'w') as f:
    f.write(content)

