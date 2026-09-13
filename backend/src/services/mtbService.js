const db = require('../database/db'); 
const crypto = require('crypto');
const EligibilityRuleEngine = require('./EligibilityRuleEngine');

class MtbService {
  constructor(dbInstance) {
    this.db = dbInstance;
  }

  // Used by period recalculation
  recalculateRunningBalance(periode_id) {
    const period = this.db.prepare('SELECT saldo_awal FROM realisasi_mtb_periode WHERE id = ?').get(periode_id);
    if (!period) return;
    
    let currentBalance = period.saldo_awal || 0;
    let totalKredit = 0;
    let totalDebet = 0;

    const txs = this.db.prepare('SELECT id, kredit, debet FROM realisasi_mtb_transaksi WHERE periode_id = ? AND is_deleted = 0 ORDER BY id ASC').all(periode_id);
    
    const updateRunning = this.db.prepare('UPDATE realisasi_mtb_transaksi SET saldo_running = ? WHERE id = ?');
    
    for (const tx of txs) {
      const k = tx.kredit || 0;
      const d = tx.debet || 0;
      currentBalance = currentBalance - k + d;
      totalKredit += k;
      totalDebet += d;
      updateRunning.run(currentBalance, tx.id);
    }
    
    this.db.prepare('UPDATE realisasi_mtb_periode SET saldo_akhir = ?, total_kredit = ?, total_debet = ? WHERE id = ?')
      .run(currentBalance, totalKredit, totalDebet, periode_id);
  }

  processMtbTransaction(payload, userId) {
    return this.db.transaction(() => {
      let { 
        periode_id, tgl_payment, unique_number, category, shipment, party, invoice_shipment, 
        bl_number, no_kwitansi, amount_exclude_tax, vat, pot_pph23_diskon, materai_adm, adm_bank, 
        debet, expense_gp, job_order_id, transaction_source, payment_log_id, payment_reference 
      } = payload;
      
      const correlation_id = `MTB-TX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      
      let snapshotJoInfo = null;
      
      if (job_order_id) {
        const jo = this.db.prepare('SELECT j.cost_type, s.un as shipment_un, j.invoice_no, j.dpp, j.ppn, j.total_invoice, j.vendor_id, j.total_paid, j.payment_status FROM job_orders j LEFT JOIN import_shipments s ON j.import_shipment_id = s.id WHERE j.id = ?').get(job_order_id);
        if (jo) {
          const eligibility = EligibilityRuleEngine.isEligibleForMTB(jo, null, []);
          if (!eligibility.eligible) {
            const err = new Error(`Job Order not eligible for MTB: ${eligibility.reason}`);
            err.status = 400;
            throw err;
          }

          category = jo.cost_type || 'LAINNYA';
          unique_number = jo.shipment_un || null;
          shipment = jo.shipment_un || null;
          invoice_shipment = jo.invoice_no || null;
          amount_exclude_tax = jo.dpp || 0;
          vat = jo.ppn || 0;
          snapshotJoInfo = { total_invoice: jo.total_invoice, total_paid: jo.total_paid, vendor_id: jo.vendor_id };
        }
      }
      
      const dp = amount_exclude_tax || 0;
      const v = vat || 0;
      const m = materai_adm || 0;
      const a = adm_bank || 0;
      const p = pot_pph23_diskon || 0;
      const d = debet || 0;
      const kredit = d > 0 ? 0 : (dp + v + m + a - p);
      
      let ip_id = null;
      if (unique_number) {
        const ip = this.db.prepare('SELECT id FROM import_projects WHERE task_unique_number = ?').get(unique_number);
        if (ip) ip_id = ip.id;
      }

      // Insert MTB
      const info = this.db.prepare(`
        INSERT INTO realisasi_mtb_transaksi (
          periode_id, tgl_payment, unique_number, category, shipment, party, invoice_shipment, bl_number, no_kwitansi,
          amount_exclude_tax, vat, pot_pph23_diskon, materai_adm, adm_bank, kredit, debet, expense_gp, import_project_id, 
          job_order_id, is_deleted, version, correlation_id, transaction_source, payment_log_id, payment_reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?)
      `).run(
        periode_id, tgl_payment, unique_number || null, category, shipment || null, party || null, 
        invoice_shipment || null, bl_number || null, no_kwitansi || null, dp, v, p, m, a, kredit, d, 
        expense_gp || null, ip_id, job_order_id || null, correlation_id, 
        transaction_source || 'MANUAL', payment_log_id || null, payment_reference || null
      );
      
      const newMtbId = info.lastInsertRowid;

      // Recalculate Periode
      this.recalculateRunningBalance(periode_id);

      // Audit Trail
      this.db.prepare('INSERT INTO realisasi_mtb_history (mtb_transaksi_id, action, perubahan, dilakukan_oleh_id, correlation_id) VALUES (?, ?, ?, ?, ?)').run(
        newMtbId, 'CREATE', JSON.stringify({ payload, jo_snapshot: snapshotJoInfo }), userId || null, correlation_id
      );
      
      console.log(JSON.stringify({ event: 'CREATE_MTB', correlation_id, transaction_id: newMtbId, user_id: userId, status: 'SUCCESS' }));
      
      return newMtbId;
    })();
  }

  updateMtbTransaction(id, payload, userId) {
    return this.db.transaction(() => {
      const tx = this.db.prepare('SELECT * FROM realisasi_mtb_transaksi WHERE id = ? AND is_deleted = 0').get(id);
      if (!tx) throw new Error('Transaction not found or deleted');
      
      let { 
        tgl_payment, unique_number, category, shipment, party, invoice_shipment, bl_number, 
        no_kwitansi, amount_exclude_tax, vat, pot_pph23_diskon, materai_adm, adm_bank, debet, 
        expense_gp, job_order_id, version, transaction_source, payment_log_id, payment_reference 
      } = payload;
      
      const correlation_id = `MTB-TX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      
      // Immutability Check
      if (tx.job_order_id && job_order_id && tx.job_order_id.toString() !== job_order_id.toString()) {
        console.log(JSON.stringify({ event: 'CONFLICT_MTB', correlation_id, transaction_id: id, reason: 'Immutable Job Order Mutation Attempted', status: 'FAILED' }));
        const err = new Error('Job Order linkage is immutable for synchronized transactions.');
        err.status = 409;
        throw err;
      }
      
      let snapshotJoInfo = null;
      const effectiveJoId = job_order_id || tx.job_order_id;
      
      if (effectiveJoId) {
        const jo = this.db.prepare('SELECT j.cost_type, s.un as shipment_un, j.invoice_no, j.dpp, j.ppn, j.total_invoice, j.total_paid, j.vendor_id, j.payment_status FROM job_orders j LEFT JOIN import_shipments s ON j.import_shipment_id = s.id WHERE j.id = ?').get(effectiveJoId);
        if (jo) {
          // Verify eligibility (we pass [] for existing realizations since we are updating the current one or replacing it)
          const eligibility = EligibilityRuleEngine.isEligibleForMTB(jo, null, []);
          if (!eligibility.eligible) {
             const err = new Error(`Job Order not eligible for MTB: ${eligibility.reason}`);
             err.status = 400;
             throw err;
          }

          category = jo.cost_type || 'LAINNYA';
          unique_number = jo.shipment_un || null;
          shipment = jo.shipment_un || null;
          invoice_shipment = jo.invoice_no || null;
          amount_exclude_tax = jo.dpp || 0;
          vat = jo.ppn || 0;
          snapshotJoInfo = { total_invoice: jo.total_invoice, total_paid: jo.total_paid, vendor_id: jo.vendor_id };
        }
      }
      
      const dp = amount_exclude_tax || 0;
      const v = vat || 0;
      const m = materai_adm || 0;
      const a = adm_bank || 0;
      const p = pot_pph23_diskon || 0;
      const d = debet || 0;
      const kredit = d > 0 ? 0 : (dp + v + m + a - p);
      
      let ip_id = null;
      if (unique_number) {
        const ip = this.db.prepare('SELECT id FROM import_projects WHERE task_unique_number = ?').get(unique_number);
        if (ip) ip_id = ip.id;
      }

      // Update Transaction (Optimistic Locking)
      const expectedVersion = version || tx.version || 1;
      const updateResult = this.db.prepare(`
        UPDATE realisasi_mtb_transaksi SET
          tgl_payment = ?, unique_number = ?, category = ?, shipment = ?, party = ?, invoice_shipment = ?, bl_number = ?, no_kwitansi = ?,
          amount_exclude_tax = ?, vat = ?, pot_pph23_diskon = ?, materai_adm = ?, adm_bank = ?, kredit = ?, debet = ?, expense_gp = ?, 
          import_project_id = ?, job_order_id = ?, correlation_id = ?, version = version + 1, updated_at = datetime('now', 'localtime'),
          transaction_source = ?, payment_log_id = ?, payment_reference = ?
        WHERE id = ? AND version = ?
      `).run(
        tgl_payment, unique_number || null, category, shipment || null, party || null, invoice_shipment || null, 
        bl_number || null, no_kwitansi || null, dp, v, p, m, a, kredit, d, expense_gp || null, ip_id, job_order_id || null, 
        correlation_id, transaction_source || tx.transaction_source || 'MANUAL', payment_log_id || tx.payment_log_id || null, 
        payment_reference || tx.payment_reference || null, id, expectedVersion
      );

      if (updateResult.changes === 0) {
         console.log(JSON.stringify({ event: 'CONFLICT_MTB', correlation_id, transaction_id: id, reason: 'Lost Update (Version Mismatch)', status: 'FAILED' }));
         const err = new Error('Transaction has been modified by another user. Please refresh and try again.');
         err.status = 409;
         throw err;
      }

      this.recalculateRunningBalance(tx.periode_id);

      this.db.prepare('INSERT INTO realisasi_mtb_history (mtb_transaksi_id, action, perubahan, dilakukan_oleh_id, correlation_id) VALUES (?, ?, ?, ?, ?)').run(
        id, 'UPDATE', JSON.stringify({ old: tx, new: payload, jo_snapshot: snapshotJoInfo }), userId || null, correlation_id
      );
      
      console.log(JSON.stringify({ event: 'UPDATE_MTB', correlation_id, transaction_id: id, user_id: userId, status: 'SUCCESS' }));
    })();
  }

  deleteMtbTransaction(id, userId, version) {
    return this.db.transaction(() => {
      const tx = this.db.prepare('SELECT * FROM realisasi_mtb_transaksi WHERE id = ? AND is_deleted = 0').get(id);
      if (!tx) throw new Error('Transaction not found or already deleted');
      
      const correlation_id = `MTB-TX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      // Optimistic Locking for Delete
      const expectedVersion = version || tx.version || 1;
      const deleteResult = this.db.prepare('UPDATE realisasi_mtb_transaksi SET is_deleted = 1, version = version + 1, correlation_id = ?, updated_at = datetime("now", "localtime") WHERE id = ? AND version = ?').run(correlation_id, id, expectedVersion);
      
      if (deleteResult.changes === 0) {
         console.log(JSON.stringify({ event: 'CONFLICT_MTB', correlation_id, transaction_id: id, reason: 'Lost Update (Version Mismatch on Delete)', status: 'FAILED' }));
         const err = new Error('Transaction has been modified by another user. Please refresh and try again.');
         err.status = 409;
         throw err;
      }

      this.recalculateRunningBalance(tx.periode_id);

      this.db.prepare('INSERT INTO realisasi_mtb_history (mtb_transaksi_id, action, perubahan, dilakukan_oleh_id, correlation_id) VALUES (?, ?, ?, ?, ?)').run(
        id, 'DELETE', JSON.stringify(tx), userId || null, correlation_id
      );
      
      console.log(JSON.stringify({ event: 'DELETE_MTB', correlation_id, transaction_id: id, user_id: userId, status: 'SUCCESS' }));
    })();
  }
}

module.exports = MtbService;
