// --- DOCUMENT TYPES API ---
app.get('/api/document-types', async (req, res) => {
  try {
    const types = await prisma.documentType.findMany({
      orderBy: { created_at: 'asc' }
    });
    res.json({ documentTypes: types.map(t => t.name) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/document-types', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    const docType = await prisma.documentType.create({
      data: { name: name.trim() }
    });
    res.json(docType);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Document type already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/document-types/:name', async (req, res) => {
  try {
    await prisma.documentType.delete({
      where: { name: req.params.name }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DOCUMENTS API ---

