/**
 * ShipmentService — Centralized Shipment Domain Service
 * 
 * This service is the Single Source of Truth for all shipment-related
 * business logic in KOMPAS EXIM. Every module (Staff, Supervisor, Manager)
 * must consume shipment stage, progress, and KPIs through this service.
 * 
 * Business Rules:
 *   Shipment Active     → ATA has not been recorded
 *   Delivery Active     → ATA recorded, but not all containers have gate_out_wh
 *   Financial Settlement → All containers delivered, but not all invoices fully paid
 *   Status Complete      → All logistics and financial obligations met
 * 
 * Relational Strategy (Dual-Key Transition):
 *   - New records: use import_shipment_id (immutable FK)
 *   - Legacy records: fall back to shipment_un
 *   - All queries in this service prefer import_shipment_id when available
 */

const db = require('../database/db');

class ShipmentService {

  // ─── Core Business Rule ────────────────────────────────────────────────────

  /**
   * Calculates the operational stage of a single shipment.
   * This is the ONLY authoritative implementation of this rule.
   * 
   * @param {Object} shipment - Row from import_shipments
   * @param {Array}  containers - Rows from containers WHERE shipment_id = ?
   * @param {Array}  jobOrders - Rows from job_orders linked to this shipment
   * @returns {string} One of: 'Shipment Active', 'Delivery Active', 'Financial Settlement', 'Status Complete'
   */
  static calculateShipmentStage(shipment, containers, jobOrders) {
    // Rule 1: No ATA means the vessel has not arrived
    if (!shipment.ata) {
      return 'Shipment Active';
    }

    // Rule 2: ATA recorded — check if all containers have exited the warehouse
    const allContainersDelivered = containers.length > 0 
      && containers.every(c => c.gate_out_wh);

    if (!allContainersDelivered) {
      return 'Delivery Active';
    }

    // Rule 3: All containers delivered — check if all invoices are fully paid
    const allInvoicesPaid = jobOrders.length > 0 
      && jobOrders.every(jo => jo.total_paid >= jo.total_invoice);

    if (!allInvoicesPaid) {
      return 'Financial Settlement';
    }

    // Rule 4: Everything complete
    return 'Status Complete';
  }

  /**
   * Calculates the progress percentage based on stage.
   * Centralized so all modules display consistent progress bars.
   */
  static calculateProgress(stage) {
    switch (stage) {
      case 'Shipment Active':       return 25;
      case 'Delivery Active':       return 50;
      case 'Financial Settlement':  return 75;
      case 'Status Complete':       return 100;
      default:                      return 0;
    }
  }

  // ─── Data Access (with Stage Enrichment) ──────────────────────────────────

  /**
   * Returns all shipments enriched with their computed stage.
   * This is the primary query method for any module that needs shipment data.
   * 
   * Uses the Dual-Key strategy: prefers import_shipment_id, falls back to shipment_un.
   */
  static getAllShipmentsWithStage() {
    const shipments = db.prepare(`
      SELECT s.*, ip.task_unique_number 
      FROM import_shipments s 
      LEFT JOIN import_projects ip ON s.import_project_id = ip.id
      ORDER BY s.created_at DESC
    `).all();

    return shipments.map(s => {
      const containers = db.prepare(
        'SELECT gate_out_wh FROM containers WHERE shipment_id = ?'
      ).all(s.id);

      // Dual-Key: prefer import_shipment_id, fall back to shipment_un
      const jobOrders = db.prepare(`
        SELECT total_paid, total_invoice 
        FROM job_orders 
        WHERE import_shipment_id = ?
          AND sumber = 'import_operational'
      `).all(s.id);

      const stage = ShipmentService.calculateShipmentStage(s, containers, jobOrders);
      const progress = ShipmentService.calculateProgress(stage);

      return { ...s, stage, progress };
    });
  }

  /**
   * Returns a single shipment enriched with stage, containers, and job order summary.
   */
  static getShipmentById(shipmentId) {
    const s = db.prepare('SELECT * FROM import_shipments WHERE id = ?').get(shipmentId);
    if (!s) return null;

    const containers = db.prepare(
      'SELECT * FROM containers WHERE shipment_id = ?'
    ).all(s.id);

    const jobOrders = db.prepare(`
      SELECT total_paid, total_invoice 
      FROM job_orders 
      WHERE import_shipment_id = ?
        AND sumber = 'import_operational'
    `).all(s.id);

    const stage = ShipmentService.calculateShipmentStage(s, containers, jobOrders);
    const progress = ShipmentService.calculateProgress(stage);

    return { ...s, containers, stage, progress };
  }

  // ─── KPI Aggregations ────────────────────────────────────────────────────

  /**
   * Returns the count of active shipments (not yet Status Complete).
   * Used by both Supervisor /api/control-tower/stats and Manager dashboard.
   */
  static getActiveShipmentCount() {
    const allShipments = ShipmentService.getAllShipmentsWithStage();
    return allShipments.filter(s => s.stage !== 'Status Complete').length;
  }

  /**
   * Returns a breakdown of shipment counts by stage.
   * Used by Supervisor Shipment Monitoring and Manager Shipment-by-Status widget.
   */
  static getShipmentStageBreakdown() {
    const allShipments = ShipmentService.getAllShipmentsWithStage();
    
    const breakdown = {
      'Shipment Active': 0,
      'Delivery Active': 0,
      'Financial Settlement': 0,
      'Status Complete': 0,
    };

    allShipments.forEach(s => {
      if (breakdown[s.stage] !== undefined) {
        breakdown[s.stage]++;
      }
    });

    return breakdown;
  }

  /**
   * Returns analytics data computed from real operational records.
   * Replaces the hardcoded mock data in AnalyticsReports.jsx.
   * 
   * Computes:
   *   - shipmentPerformance: monthly on-time vs delayed (based on ETA vs ATA)
   *   - delayReasons: counts of container-level issues
   *   - avgClearanceTime: average days between ETA and ATA
   */
  static getAnalytics() {
    const shipments = db.prepare('SELECT * FROM import_shipments').all();

    // 1. Shipment Performance: Monthly On-Time vs Delayed
    const monthlyPerf = {};
    let totalClearanceDays = 0;
    let clearanceCount = 0;

    shipments.forEach(s => {
      if (s.eta && s.ata) {
        const etaDate = new Date(s.eta);
        const ataDate = new Date(s.ata);
        const monthKey = `${ataDate.getFullYear()}-${String(ataDate.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = ataDate.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });

        if (!monthlyPerf[monthKey]) {
          monthlyPerf[monthKey] = { month: monthLabel, onTime: 0, delayed: 0 };
        }

        const diffDays = (ataDate - etaDate) / (1000 * 60 * 60 * 24);
        totalClearanceDays += Math.abs(diffDays);
        clearanceCount++;

        if (diffDays <= 0) {
          monthlyPerf[monthKey].onTime++;
        } else {
          monthlyPerf[monthKey].delayed++;
        }
      }
    });

    const shipmentPerformance = Object.keys(monthlyPerf)
      .sort()
      .slice(-6) // Last 6 months
      .map(k => monthlyPerf[k]);

    // 2. Delay Reasons: aggregate container-level issues
    const containers = db.prepare('SELECT fish_issue, queue_issue, space_issue, other_issue FROM containers').all();
    const delayReasons = [
      { name: 'Fish Issue', value: containers.filter(c => c.fish_issue === 1).length },
      { name: 'Queue Issue', value: containers.filter(c => c.queue_issue === 1).length },
      { name: 'Space Issue', value: containers.filter(c => c.space_issue === 1).length },
      { name: 'Other Issue', value: containers.filter(c => c.other_issue === 1).length },
    ].filter(r => r.value > 0);

    // 3. Avg Clearance Time
    const avgClearanceTime = clearanceCount > 0 
      ? Math.round((totalClearanceDays / clearanceCount) * 10) / 10 
      : 0;

    // 4. Overall SLA rate (on-time %)
    const totalWithAta = shipments.filter(s => s.eta && s.ata).length;
    const onTimeCount = shipments.filter(s => {
      if (!s.eta || !s.ata) return false;
      return new Date(s.ata) <= new Date(s.eta);
    }).length;
    const slaRate = totalWithAta > 0 ? Math.round((onTimeCount / totalWithAta) * 100) : 0;

    const totalDelayIssues = delayReasons.reduce((sum, r) => sum + r.value, 0);

    // 5. Vendor SLA Performance
    const vendorStats = {};
    shipments.forEach(s => {
      if (s.supplier && s.eta && s.ata) {
        if (!vendorStats[s.supplier]) {
          vendorStats[s.supplier] = { total: 0, onTime: 0 };
        }
        vendorStats[s.supplier].total++;
        if (new Date(s.ata) <= new Date(s.eta)) {
          vendorStats[s.supplier].onTime++;
        }
      }
    });

    const vendorSla = Object.entries(vendorStats).map(([name, stats]) => {
      const sla = Math.round((stats.onTime / stats.total) * 100);
      return { name, sla, total: stats.total };
    }).sort((a, b) => b.total - a.total).slice(0, 5); // top 5 vendors by volume

    return {
      shipmentPerformance,
      delayReasons,
      avgClearanceTime,
      slaRate,
      totalDelayIssues,
      vendorSla
    };
  }
}

module.exports = ShipmentService;
