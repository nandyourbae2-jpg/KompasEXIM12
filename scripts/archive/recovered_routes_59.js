app.post('/api/tasks', authenticateToken, (req, res) => {
  try {
    let { judul, deskripsi, departemen, prioritas, status, sumber_tugas, assignee_id, import_project_id, tenggat } = req.body;
    
    const assigned_by_id = req.user.id;
    const creatorLevel = req.user.level_otoritas;
    if (!departemen) departemen = req.user.departemen;