import re

file_path = "src/pages/Supervisor/AeControlTower.jsx"
with open(file_path, "r") as f:
    content = f.read()

if "match-reviews" not in content:
    # Add state for match reviews
    state_injection = """
  const [matchReviewsCount, setMatchReviewsCount] = useState(0);

  const fetchMatchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/source/match-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMatchReviewsCount(json.data.length);
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (token) {
      fetchJobs();
      fetchMatchReviews();
    }
  }, [token]);
"""
    content = re.sub(r'  useEffect\(\(\) => \{\n    if \(token\) fetchJobs\(\);\n  \}, \[token\]\);', state_injection, content)

    # Add banner after header
    banner_injection = """
      {matchReviewsCount > 0 && (
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
      )}
"""
    content = content.replace('<div className="act-header">', banner_injection + '      <div className="act-header">')
    
    with open(file_path, "w") as f:
        f.write(content)
    print("Tower patched")
else:
    print("Tower already patched")
