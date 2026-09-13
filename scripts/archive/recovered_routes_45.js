    const jos = db.prepare('SELECT * FROM job_orders ORDER BY created_at DESC').all();
    const allPayments = db.prepare('SELECT * FROM payment_logs').all();
    
    // Group payments by job_order_id
    const paymentsByJo = {};
    for (const p of allPayments) {
      if (!paymentsByJo[p.job_order_id]) paymentsByJo[p.job_order_id] = [];
      paymentsByJo[p.job_order_id].push(p);
    }

    jos.forEach(jo => { 
      jo.remaining_balance = jo.total_invoice - jo.total_paid; 
      jo.payment_logs = paymentsByJo[jo.id] || [];
    });
    res.json(jos);