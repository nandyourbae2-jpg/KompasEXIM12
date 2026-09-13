});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});