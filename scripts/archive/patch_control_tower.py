import re

file_path = "src/pages/Supervisor/AeControlTower.jsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Fix Match Review Fetching Error State
match_review_state_replacement = """
  const [matchReviewsCount, setMatchReviewsCount] = useState(0);
  const [matchReviewsError, setMatchReviewsError] = useState(false);

  const fetchMatchReviews = async () => {
    setMatchReviewsError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/source/match-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMatchReviewsCount(json.data.length);
      } else {
        setMatchReviewsError(true);
      }
    } catch(e) {
      setMatchReviewsError(true);
    }
  };
"""
content = re.sub(
    r'  const \[matchReviewsCount, setMatchReviewsCount\] = useState\(0\);\n.*?(?=\n  useEffect)',
    match_review_state_replacement.strip(),
    content,
    flags=re.DOTALL
)

# 2. Fix Match Review Banner Display
match_review_banner = """
      {matchReviewsError ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#b91c1c' }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Failed to load Match Reviews. API Error.</span>
        </div>
      ) : matchReviewsCount > 0 ? (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b45309' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>You have {matchReviewsCount} pending Source Match Review{matchReviewsCount > 1 ? 's' : ''}. Some imported log schedule rows are ambiguous.</span>
          </div>
          <button 
            onClick={() => navigate('/workspace/supervisor/match-review')}
            style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
          >
            Review Now
          </button>
        </div>
      ) : null}
"""
content = re.sub(
    r'      \{matchReviewsCount > 0 && \([\s\S]*?\}\)',
    match_review_banner.strip(),
    content
)


# 3. Fix Redundant Assignment Fetch
redundant_fetch_replacement = """
          onSuccess={(updatedJob) => {
            setJobs(prev => prev.map(j => j.id === updatedJob.id ? { ...j, ...updatedJob } : j));
            setSelectedJob(null);
          }}
"""
content = re.sub(
    r'          onSuccess=\{\(updatedJob\) => \{[\s\S]*?\}\}',
    redundant_fetch_replacement.strip(),
    content
)

# 4. Fix Closing Docs Display
closing_docs_display = """
                      <td>
                        {job.closing_docs ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{job.closing_docs}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>Pending Source Update</span>
                        )}
                      </td>
"""
content = re.sub(
    r'                      <td>\s*\{job\.closing_docs \? \([\s\S]*?\) : \'-\'\}\s*</td>',
    closing_docs_display.strip(),
    content
)

# 5. Fix Empty vs Error State in Table
# Find `displayedJobs.length === 0 ? (`
empty_state = """
                {error ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#ef4444' }}>
                      <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
                      Data Control Tower gagal dimuat. API Error.
                    </td>
                  </tr>
                ) : displayedJobs.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      {filterMode === 'All' ? 'Belum ada pekerjaan AE aktif.' : 'Tidak ada pekerjaan untuk filter ini.'}
                    </td>
                  </tr>
                ) : (
"""
content = content.replace("                {displayedJobs.length === 0 ? (", empty_state.strip())

# Remove `{error && ...}` from above since it's now handled in the table
content = re.sub(
    r'      \{error && \(\s*<div className="act-error">[\s\S]*?</div>\s*\)\}',
    '',
    content
)


with open(file_path, "w") as f:
    f.write(content)
print("AeControlTower.jsx patched successfully")
