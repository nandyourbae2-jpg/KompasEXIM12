// --- 5. JOB ORDERS & PAYMENTS ---
app.get('/api/job-orders/available-months', (req, res) => {
  try {
    const months = db.prepare(`
      SELECT DISTINCT
        strftime('%Y-%m', tanggal_invoice) as month_key,
        strftime('%m', tanggal_invoice) as bulan,
        strftime('%Y', tanggal_invoice) as tahun
      FROM job_orders
      WHERE tanggal_invoice IS NOT NULL
      ORDER BY month_key DESC
    `).all();
    res.json(months);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/job-orders', (req, res) => {