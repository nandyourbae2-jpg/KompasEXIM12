    jos.forEach(jo => { 
      jo.remaining_balance = jo.total_invoice - jo.total_paid;
      if (jo.total_paid >= jo.total_invoice && jo.total_invoice > 0) jo.status_badge = 'Lunas';
      else if (jo.total_paid > 0) jo.status_badge = 'Bayar Sebagian';
      else jo.status_badge = 'Belum Dibayar';
      jo.payment_logs = paymentsByJo[jo.id] || [];
    });
    res.json(jos);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/job-orders/:id', authenticateToken, (req, res) => {
  try {
    const jo = db.prepare('SELECT * FROM job_orders WHERE id = ?').get(req.params.id);
    if (!jo) return res.status(404).json({ error: 'Not found' });
    jo.remaining_balance = jo.total_invoice - jo.total_paid;
    if (jo.total_paid >= jo.total_invoice && jo.total_invoice > 0) jo.status_badge = 'Lunas';
    else if (jo.total_paid > 0) jo.status_badge = 'Bayar Sebagian';
    else jo.status_badge = 'Belum Dibayar';
    res.json(jo);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});