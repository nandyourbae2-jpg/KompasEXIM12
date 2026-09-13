import re
file_path = "src/pages/Supervisor/AeControlTower.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Add state variables
state_vars = """  const [selectedJob, setSelectedJob] = useState(null);
  
  // Match Review state
  const [matchReviewsCount, setMatchReviewsCount] = useState(0);
  const [matchReviewsError, setMatchReviewsError] = useState(false);"""
content = content.replace("  const [selectedJob, setSelectedJob] = useState(null);", state_vars)

# Add fetch function
fetch_func = """  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ae/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Gagal memuat jobs');
      setJobs(json.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/source/match-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) {
        setMatchReviewsError(true);
        return;
      }
      setMatchReviewsCount(json.data ? json.data.length : 0);
      setMatchReviewsError(false);
    } catch (err) {
      setMatchReviewsError(true);
    }
  };"""
content = re.sub(r"  const fetchJobs = async \(\) => \{[\s\S]*?  \};\n", fetch_func + "\n", content)

# Add to useEffect
use_effect = """  useEffect(() => {
    fetchJobs();
    fetchMatchReviews();
  }, [token]);"""
content = re.sub(r"  useEffect\(\(\) => \{\n    fetchJobs\(\);\n  \}, \[token\]\);", use_effect, content)

with open(file_path, "w") as f:
    f.write(content)
