import sys

with open('src/pages/Staff/AeMyWork.jsx', 'r') as f:
    content = f.read()

# I need to change the fetch logic
old_fetch = """  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ae/my-jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        
        const data = json.data || [];
        setJobs(data);

        // Compute local KPIs
        let actionRequired = 0;
        let atRisk = 0;
        let completed = 0;

        for (const job of data) {
           if (job.ae_status === 'Completed') {
             completed++;
             continue;
           }
           if (job.priority === 'CRITICAL' || job.priority === 'OVERDUE') atRisk++;
           if (job.nextAction?.startsWith('Execute:')) actionRequired++;
        }

        setKpis({
          actionRequired,
          atRisk,
          completed,
          totalActive: data.filter(j => j.ae_status !== 'Completed').length
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchJobs();
  }, [token]);"""

new_fetch = """  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ae/my-work`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        
        const data = json.data || {};
        
        setKpis({
          actionRequired: data.actionRequired || 0,
          atRisk: (data.waitingBlocked || 0) + (data.overdue || 0),
          completed: data.completed || 0,
          totalActive: (data.actionRequired || 0) + (data.waitingBlocked || 0) + (data.handoverReady || 0) + (data.overdue || 0)
        });
        
        // Let's also fetch jobs for the preview table
        const jobsRes = await fetch(`${API_BASE_URL}/ae/my-jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const jobsJson = await jobsRes.json();
        setJobs(jobsJson.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchMetrics();
  }, [token]);"""

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch)
    with open('src/pages/Staff/AeMyWork.jsx', 'w') as f:
        f.write(content)
    print("Patched AeMyWork fetch")
else:
    print("Could not find AeMyWork fetch block")
