});

app.delete('/api/job-orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const jo = db.prepare('SELECT id FROM job_orders WHERE id = ?').get(id);
    if (!jo) {
      return res.status(404).json({ error: 'Job Order not found' });
    }
    
    db.transaction(() => {
      db.prepare('DELETE FROM payment_logs WHERE job_order_id = ?').run(id);
      db.prepare('DELETE FROM job_orders WHERE id = ?').run(id);
    })();
    
    res.json({ message: 'Job Order deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/import-projects', authenticateToken, (req, res) => {