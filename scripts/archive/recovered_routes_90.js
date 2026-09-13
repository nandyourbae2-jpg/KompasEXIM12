app.patch('/api/tasks/:id/status', authenticateToken, (req, res) => {
  try {
    const { status, status_dari } = req.body;
    const validStatuses = ['Backlog', 'Akan Dikerjakan', 'Dalam Proses', 'Review', 'Selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }
    const diubah_oleh_id = req.user.id;