// --- TASKS API ---
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        statusHistory: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { id, title, department, priority, status, assigneeId, dueDate, importProjectId, shipment_un, sumber_tugas, assigned_by_id, notes, statusHistory } = req.body;
    
    const task = await prisma.task.create({
      data: {
        id,
        title,
        department,
        priority,
        status,
        assigneeId,
        dueDate,
        importProjectId,
        shipment_un,
        sumber_tugas,
        assigned_by_id,
        notes,
        statusHistory: {
          create: statusHistory || []
        }
      },
      include: { statusHistory: true }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { notes } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { notes }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:id/move', async (req, res) => {
  try {
    const { status, label, fromStatus, timestamp } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status,
        statusHistory: {
          create: {
            status,
            label,
            fromStatus,
            timestamp: new Date(timestamp)
          }
        }
      },
      include: { statusHistory: true }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {

