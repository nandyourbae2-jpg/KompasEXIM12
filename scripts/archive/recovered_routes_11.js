app.post('/api/tasks', async (req, res) => {
  try {
    const { id: optimisticId, title, department, priority, status, assigneeId, dueDate, importProjectId, shipment_un, sumber_tugas, assigned_by_id, notes, statusHistory } = req.body;
    
    // Generate Task ID at Backend to avoid Race Conditions & Unique Constraint Errors
    const allTasks = await prisma.task.findMany({ select: { id: true } });
    const nums = allTasks.map(t => {
      const match = t.id.match(/TSK-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const highest = nums.length > 0 ? Math.max(...nums) : 85;
    const realId = `TSK-${String(highest + 1).padStart(4, '0')}`;

    const task = await prisma.task.create({
      data: {
        id: realId,
        title,
        department,