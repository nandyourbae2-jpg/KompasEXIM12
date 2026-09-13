// --- 1. AUTHENTICATION ---
app.post('/api/log-error', (req, res) => {
  console.log('FRONTEND ERROR LOGGED:', req.body);
  fs.writeFileSync(path.join(__dirname, 'frontend-error.log'), JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {