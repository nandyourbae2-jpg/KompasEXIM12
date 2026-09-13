/**
 * FinancialService — Centralized Financial Domain Service
 * 
 * Single Source of Truth for all financial KPIs and cost aggregations.
 * Ensures that Staff, Supervisor, and Manager display identical financial data.
 * 
 * Business Rules:
 *   - Cost categories are derived from cost_type column in job_orders
 *   - Categories: TRUC (Trucking), LINE (Freight), DEPO, LOLO, OTHE/PIB (Customs), DO
 *   - Payment status: total_paid vs total_invoice per job order
 * 
 * Consumed by:
 *   - Supervisor: SpvFinancialMonitoring
 *   - Manager: /api/manager/dashboard (Cost Monitoring widget)
 *   - Future: Financial Reports, Analytics
 */

const db = require('../database/db');

class FinancialService {

  // ─── Cost Category Mapping ───────────────────────────────────────────────

  /**
   * Maps a raw cost_type string to a standardized cost category.
   * This is the ONLY place cost category classification happens.
   * 
   * @param {string} costType - Raw cost_type from job_orders
   * @returns {string} Standardized category name
   */
  static classifyCostType(costType) {
    const ct = (costType || '').toUpperCase();
    if (ct.includes('TRUC')) return 'Trucking';
    if (ct.includes('LINE')) return 'Freight & Line';
    if (ct.includes('PIB') || ct.includes('CUSTOMS') || ct.includes('PERIZINAN')) return 'Customs & PIB';
    if (ct.includes('DEPO')) return 'Depo & Storage';
    if (ct.includes('LOLO')) return 'Lolo & Reimb';
    if (ct.includes('DO')) return 'DO/BL Fee';
    return 'Other';
  }

  // ─── Cost Breakdown ──────────────────────────────────────────────────────

  /**
   * Returns cost breakdown by category, with optional time filtering.
   * Used by Manager dashboard Cost Monitoring and Supervisor Financial Monitoring.
   * 
   * @param {Object} options
   * @param {string} options.period - 'YTD', 'monthly', or 'all' (default: 'all')
   * @param {string} options.shipmentUn - Filter by specific shipment UN (optional)
   * @returns {{ categories: Array<{name, total_invoice, total_paid}>, grand_total_invoice, grand_total_paid, grand_outstanding }}
   */
  static getCostBreakdown(options = {}) {
    const { period = 'all', importShipmentId = null } = options;

    let whereClause = '1=1';
    const params = [];

    if (importShipmentId) {
      whereClause += ' AND import_shipment_id = ?';
      params.push(importShipmentId);
    }

    if (period === 'monthly') {
      whereClause += " AND strftime('%Y-%m', COALESCE(tanggal_invoice, created_at)) = strftime('%Y-%m', 'now', 'localtime')";
    } else if (period === 'YTD') {
      whereClause += " AND strftime('%Y', COALESCE(tanggal_invoice, created_at)) = strftime('%Y', 'now', 'localtime')";
    }

    const jobOrders = db.prepare(`
      SELECT cost_type, total_invoice, total_paid
      FROM job_orders
      WHERE ${whereClause}
    `).all(...params);

    // Aggregate by standardized category
    const categoryMap = {};
    let grandTotalInvoice = 0;
    let grandTotalPaid = 0;

    jobOrders.forEach(jo => {
      const category = FinancialService.classifyCostType(jo.cost_type);
      if (!categoryMap[category]) {
        categoryMap[category] = { name: category, total_invoice: 0, total_paid: 0 };
      }
      const invoice = jo.total_invoice || 0;
      const paid = jo.total_paid || 0;
      categoryMap[category].total_invoice += invoice;
      categoryMap[category].total_paid += paid;
      grandTotalInvoice += invoice;
      grandTotalPaid += paid;
    });

    const categories = Object.values(categoryMap)
      .filter(c => c.total_invoice > 0)
      .sort((a, b) => b.total_invoice - a.total_invoice);

    return {
      categories,
      grand_total_invoice: grandTotalInvoice,
      grand_total_paid: grandTotalPaid,
      grand_outstanding: grandTotalInvoice - grandTotalPaid,
    };
  }

  // ─── Payment Stats ───────────────────────────────────────────────────────

  /**
   * Returns high-level payment statistics.
   * Used by Manager dashboard Financial Settlement widget.
   */
  static getPaymentStats() {
    const row = db.prepare(`
      SELECT 
        COUNT(*) as total_jo,
        COALESCE(SUM(total_invoice), 0) as total_invoice,
        COALESCE(SUM(total_paid), 0) as total_paid,
        COUNT(CASE WHEN total_paid >= total_invoice AND total_invoice > 0 THEN 1 END) as fully_paid_count,
        COUNT(CASE WHEN total_paid < total_invoice AND total_invoice > 0 THEN 1 END) as outstanding_count
      FROM job_orders
    `).get();

    return {
      total_jo: row.total_jo,
      total_invoice: row.total_invoice,
      total_paid: row.total_paid,
      outstanding: row.total_invoice - row.total_paid,
      fully_paid_count: row.fully_paid_count,
      outstanding_count: row.outstanding_count,
    };
  }

  /**
   * Returns approval-related counts (PIB requests pending, financial requests pending).
   * Used by Supervisor and Manager dashboards.
   */
  static getApprovalStats() {
    const pibPending = db.prepare(
      "SELECT COUNT(*) as n FROM pib_requests WHERE status = 'Submitted'"
    ).get().n;

    let frPending = 0;
    try {
      frPending = db.prepare(
        "SELECT COUNT(*) as n FROM financial_requests WHERE status = 'Pending'"
      ).get().n;
    } catch (e) {
      // financial_requests table may not exist yet
    }

    return {
      pib_pending: pibPending,
      fr_pending: frPending,
      total_pending: pibPending + frPending,
    };
  }
}

module.exports = FinancialService;
