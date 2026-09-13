const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// GET /api/v1/manager/vendor-analytics
// READ-ONLY aggregation endpoint for Executive Control Tower
router.get('/manager/vendor-analytics', authenticateToken, requireRole(['Manager']), (req, res, next) => {
  try {
    // 1. Total Trucking Spend & Job Orders count
    const joStats = db.prepare(`
      SELECT
        COALESCE(SUM(j.total_invoice), 0) as total_spend,
        COUNT(j.id) as total_job_orders
      FROM job_orders j
      JOIN vendors v ON j.vendor_id = v.id
      WHERE v.service_type = 'Trucking'
    `).get();

    // 2. Active Trucking Vendors
    const activeVendors = db.prepare(`
      SELECT COUNT(id) as active_count
      FROM vendors
      WHERE service_type = 'Trucking' AND status = 'Aktif'
    `).get();

    // 3. Top Vendor Spend (for Concentration & Matrix)
    const vendorSpendList = db.prepare(`
      SELECT
        v.id,
        v.nama,
        COALESCE(SUM(j.total_invoice), 0) as spend,
        COUNT(j.id) as job_orders,
        v.status
      FROM vendors v
      LEFT JOIN job_orders j ON j.vendor_id = v.id
      WHERE v.service_type = 'Trucking'
      GROUP BY v.id, v.nama, v.status
      ORDER BY spend DESC
    `).all();

    // 4. Fleet Compliance
    const fleetStats = db.prepare(`
      SELECT
        COUNT(vendor_fleets.id) as total_fleet,
        COALESCE(SUM(CASE WHEN compliance_status = 'Compliant' THEN 1 ELSE 0 END), 0) as compliant_fleet,
        COALESCE(SUM(CASE WHEN compliance_status = 'Expired' THEN 1 ELSE 0 END), 0) as expired_fleet,
        COALESCE(SUM(CASE WHEN compliance_status = 'Maintenance' THEN 1 ELSE 0 END), 0) as maintenance_fleet
      FROM vendor_fleets
      JOIN vendors v ON vendor_fleets.vendor_id = v.id
      WHERE v.service_type = 'Trucking'
    `).get();

    // 5. Claims (Debit Notes)
    const claimStats = db.prepare(`
      SELECT
        d.id as claim_id,
        d.claim_kepada as claim_vendor_name,
        COALESCE(d.jumlah_klaim, 0) as claim_amount,
        d.linked_job_order_id,
        d.status
      FROM debit_notes d
      WHERE d.claim_kategori = 'Claim Trucking'
      ORDER BY d.created_at DESC
    `).all();

    // 6. Rate Card Coverage
    const rateCardStats = db.prepare(`
      SELECT
        COUNT(DISTINCT v.id) as vendors_with_rate_card
      FROM vendors v
      JOIN vendor_rate_cards rc ON v.id = rc.vendor_id
      WHERE v.service_type = 'Trucking' AND v.status = 'Aktif' AND rc.status = 'Aktif'
    `).get();

    res.json({
       total_spend: joStats.total_spend,
       total_job_orders: joStats.total_job_orders,
       active_vendors: activeVendors.active_count,
       vendor_performance: vendorSpendList,
       fleet_stats: fleetStats,
       claims: claimStats,
       rate_card_coverage: {
         vendors_with_rate_card: rateCardStats.vendors_with_rate_card
       }
    });
  } catch (error) {
    next(error);
  }
});
// GET /api/v1/manager/strategic-analytics
// READ-ONLY aggregation for Strategic Analytics Dashboard
router.get('/manager/strategic-analytics', authenticateToken, requireRole(['Manager']), (req, res, next) => {
  try {
    // 1. Financial Exposure
    const finStats = db.prepare(`
      SELECT
        COALESCE(SUM(total_estimasi), 0) as total_exposure,
        COUNT(id) as request_volume,
        COALESCE(SUM(CASE WHEN status = 'Lunas' THEN total_estimasi ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status != 'Lunas' AND status != 'Cancelled' THEN total_estimasi ELSE 0 END), 0) as outstanding_amount
      FROM financial_request_ledger
    `).get();

    // 2. Operational Trend
    const opStats = db.prepare(`
      SELECT
        COUNT(id) as total_shipments,
        SUM(CASE WHEN ata IS NULL THEN 1 ELSE 0 END) as active_shipments
      FROM import_shipments
    `).get();

    const taskStats = db.prepare(`
      SELECT
        COUNT(id) as total_tasks,
        SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as completed_tasks
      FROM tasks
    `).get();

    // 3. Vendor Strategy
    const vendorStats = db.prepare(`
      SELECT
        COUNT(DISTINCT v.id) as active_trucking_vendors,
        COALESCE(SUM(j.total_invoice), 0) as trucking_spend
      FROM vendors v
      LEFT JOIN job_orders j ON j.vendor_id = v.id
      WHERE v.service_type = 'Trucking' AND v.status = 'Aktif'
    `).get();

    res.json({
      financial_exposure: {
        total_exposure: finStats.total_exposure,
        request_volume: finStats.request_volume,
        paid_amount: finStats.paid_amount,
        outstanding_amount: finStats.outstanding_amount
      },
      operational_trend: {
        total_shipments: opStats.total_shipments,
        active_shipments: opStats.active_shipments || 0,
        total_tasks: taskStats.total_tasks,
        completed_tasks: taskStats.completed_tasks || 0
      },
      vendor_strategy: {
        active_trucking_vendors: vendorStats.active_trucking_vendors,
        trucking_spend: vendorStats.trucking_spend
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/manager/import-control-tower
// READ-ONLY aggregated metrics for Manager Import Overview
router.get('/manager/import-control-tower', authenticateToken, requireRole(['Manager']), (req, res, next) => {
  try {
    // 1. Shipment Overview
    const shipmentStats = db.prepare(`
      SELECT
        COUNT(id) as total_shipments,
        SUM(CASE WHEN ata IS NULL THEN 1 ELSE 0 END) as active_shipments,
        SUM(CASE WHEN ata IS NOT NULL THEN 1 ELSE 0 END) as completed_shipments,
        0 as cancelled_shipments
      FROM import_shipments
    `).get();

    // 2. Operational Tasks
    const taskStats = db.prepare(`
      SELECT
        COUNT(id) as total_tasks,
        SUM(CASE WHEN status != 'Selesai' THEN 1 ELSE 0 END) as active_tasks,
        SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN tenggat < datetime('now') AND status != 'Selesai' THEN 1 ELSE 0 END) as overdue_tasks
      FROM tasks
      WHERE departemen = 'Import'
    `).get();

    // 3. Documents
    const docStats = db.prepare(`
      SELECT
        COUNT(id) as total_docs,
        SUM(CASE WHEN status != 'Aktif' THEN 1 ELSE 0 END) as pending_docs
      FROM documents
      WHERE departemen = 'Import'
    `).get();

    // 3b. Project Documents Breakdown (Monitoring)
    const projects = db.prepare("SELECT id, task_unique_number, supplier FROM import_projects ORDER BY created_at DESC").all();
    const countStmt = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN draft_confirmed_date IS NOT NULL AND original_receive_date IS NOT NULL THEN 1 ELSE 0 END) as complete FROM dokumen_monitoring_baris WHERE import_project_id = ?`);
    
    const monitoringList = projects.map(p => {
      const counts = countStmt.get(p.id);
      return { 
        project_id: p.task_unique_number, 
        supplier: p.supplier,
        doc_complete: counts?.complete || 0, 
        doc_total: counts?.total || 0 
      };
    });

    // 4. Customs / PIB
    const pibStats = db.prepare(`
      SELECT
        COUNT(id) as total_pib,
        SUM(CASE WHEN status = 'Pending' OR status = 'Draft' THEN 1 ELSE 0 END) as pending_clearance
      FROM pib_requests
    `).get();

    // 5. Financial Exposure (Import related jobs & requests)
    const finStats = db.prepare(`
      SELECT
        COALESCE(SUM(total_estimasi), 0) as total_exposure,
        COALESCE(SUM(CASE WHEN status = 'Lunas' THEN total_estimasi ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status != 'Lunas' AND status != 'Cancelled' THEN total_estimasi ELSE 0 END), 0) as outstanding_amount
      FROM financial_request_ledger
    `).get();

    // 6. Trucking / Logistics Intelligence
    const truckingStats = db.prepare(`
      SELECT
        COUNT(DISTINCT v.id) as active_trucking_vendors,
        COALESCE(SUM(j.total_invoice), 0) as total_trucking_spend,
        COUNT(j.id) as trucking_job_orders
      FROM vendors v
      LEFT JOIN job_orders j ON j.vendor_id = v.id
      WHERE v.service_type = 'Trucking' AND v.status = 'Aktif'
    `).get();
    
    // Vendor List for the table section
    const vendorSpendList = db.prepare(`
      SELECT
        v.id,
        v.nama,
        COALESCE(SUM(j.total_invoice), 0) as spend,
        COUNT(j.id) as job_orders,
        v.status
      FROM vendors v
      LEFT JOIN job_orders j ON j.vendor_id = v.id
      WHERE v.service_type = 'Trucking'
      GROUP BY v.id, v.nama, v.status
      ORDER BY spend DESC
    `).all();

    // Fleet Compliance
    const fleetStats = db.prepare(`
      SELECT
        COUNT(vendor_fleets.id) as total_fleet,
        COALESCE(SUM(CASE WHEN compliance_status = 'Compliant' THEN 1 ELSE 0 END), 0) as compliant_fleet,
        COALESCE(SUM(CASE WHEN compliance_status = 'Expired' THEN 1 ELSE 0 END), 0) as expired_fleet,
        COALESCE(SUM(CASE WHEN compliance_status = 'Maintenance' THEN 1 ELSE 0 END), 0) as maintenance_fleet
      FROM vendor_fleets
      JOIN vendors v ON vendor_fleets.vendor_id = v.id
      WHERE v.service_type = 'Trucking'
    `).get();

    // Issues & Claims
    const claimStats = db.prepare(`
      SELECT
        COUNT(d.id) as total_claims,
        COALESCE(SUM(CASE WHEN d.status = 'Open' THEN 1 ELSE 0 END), 0) as active_claims
      FROM debit_notes d
      WHERE d.claim_kategori = 'Claim Trucking'
    `).get();
    
    const claimDetails = db.prepare(`
      SELECT claim_kepada as claim_vendor_name 
      FROM debit_notes 
      WHERE claim_kategori = 'Claim Trucking'
    `).all();
    // 7. Team Progress (SPV vs Staff)
    const teamProgress = db.prepare(`
      SELECT
        COALESCE(u.nama, 'Unassigned') as role,
        COUNT(t.id) as total,
        SUM(CASE WHEN t.status = 'Selesai' THEN 1 ELSE 0 END) as completed
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.departemen = 'Import'
      GROUP BY u.id, u.nama
    `).all();

    // 8. Approval Center (Import related)
    const pendingPib = db.prepare(`
      SELECT id, request_number, aju_pib, kasbon_diminta as amount, created_at
      FROM pib_requests
      WHERE status = 'Submitted'
    `).all();

    const pendingFin = db.prepare(`
      SELECT id, request_number, sumber_kategori as type, estimasi_nominal as amount, created_at
      FROM financial_requests
      WHERE status = 'Submitted' AND departemen = 'Import'
    `).all();
    // 9. Demurrage Risk Analysis
    const demurrageRisk = db.prepare(`
      SELECT 
        id, shipment_code, ata, free_time_destination,
        CAST(julianday('now') - julianday(ata) AS INTEGER) as days_at_port
      FROM import_shipments
      WHERE ata IS NOT NULL AND atd IS NULL
    `).all().map(s => {
      const ft = s.free_time_destination || 7;
      const risk_level = s.days_at_port >= ft ? 'Critical' 
                       : s.days_at_port >= ft - 3 ? 'Warning' 
                       : 'Safe';
      return { ...s, risk_level };
    });

    // 10. Problem Escalation
    const problemEscalation = db.prepare(`
      SELECT id, judul, tipe, tanggal, isi 
      FROM reports
      WHERE departemen = 'Import' AND tanggapan_manager IS NULL AND ditinjau_manager = 0
    `).all();

    // 11. Transport Mode Split
    const transportModes = db.prepare(`
      SELECT COALESCE(mode_transport, 'Unknown') as mode, COUNT(id) as count
      FROM import_shipments
      GROUP BY mode_transport
    `).all();

    res.json({
      shipments: {
        total: shipmentStats.total_shipments,
        active: shipmentStats.active_shipments,
        completed: shipmentStats.completed_shipments,
        cancelled: shipmentStats.cancelled_shipments
      },
      tasks: {
        total: taskStats.total_tasks,
        active: taskStats.active_tasks,
        completed: taskStats.completed_tasks,
        overdue: taskStats.overdue_tasks
      },
      documents: {
        total: docStats.total_docs,
        pending: docStats.pending_docs,
        monitoringList: monitoringList
      },
      customs: {
        total: pibStats.total_pib,
        pending_clearance: pibStats.pending_clearance
      },
      financial: {
        total_exposure: finStats.total_exposure,
        paid_amount: finStats.paid_amount,
        outstanding_amount: finStats.outstanding_amount
      },
      trucking: {
        active_vendors: truckingStats.active_trucking_vendors,
        total_spend: truckingStats.total_trucking_spend,
        job_orders: truckingStats.trucking_job_orders,
        fleet: fleetStats,
        claims: {
          total: claimStats.total_claims,
          active: claimStats.active_claims,
          details: claimDetails
        },
        vendor_performance: vendorSpendList
      },
      team_progress: teamProgress,
      demurrage_risk: demurrageRisk,
      problem_escalation: problemEscalation,
      transport_modes: transportModes,
      approvals: {
        pib: pendingPib,
        financial: pendingFin
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});



// GET /api/v1/manager/dashboard
// Company-Wide Dashboard Aggregation
router.get('/manager/dashboard', authenticateToken, requireRole(['Manager']), (req, res, next) => {
  try {
    const { trend_days } = req.query;
    const days = parseInt(trend_days) || 7;

    // 1. Active Shipments
    const shipments = db.prepare(`
      SELECT COUNT(id) as active_count
      FROM import_shipments
      WHERE ata IS NULL
    `).get();

    // 2. Global Tasks & Overdue
    const tasks = db.prepare(`
      SELECT
        COUNT(id) as total,
        SUM(CASE WHEN status != 'Selesai' THEN 1 ELSE 0 END) as tugas_aktif,
        SUM(CASE WHEN tenggat < datetime('now') AND status != 'Selesai' THEN 1 ELSE 0 END) as overdue
      FROM tasks
    `).get();

    // 3. Department Health Matrix
    const deptMatrix = db.prepare(`
      SELECT
        departemen,
        SUM(CASE WHEN status != 'Selesai' THEN 1 ELSE 0 END) as active_tasks,
        SUM(CASE WHEN tenggat < datetime('now') AND status != 'Selesai' THEN 1 ELSE 0 END) as overdue_tasks
      FROM tasks
      WHERE departemen IN ('Import', 'Export', 'AO', 'AE', 'Finance')
      GROUP BY departemen
    `).all();

    // 4. Financial Status
    const financial = db.prepare(`
      SELECT
        COUNT(id) as total_requests,
        COALESCE(SUM(total_estimasi), 0) as total_invoice,
        COALESCE(SUM(CASE WHEN status = 'Lunas' THEN total_estimasi ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status != 'Lunas' AND status != 'Cancelled' THEN total_estimasi ELSE 0 END), 0) as outstanding
      FROM financial_request_ledger
    `).get();

    // 5. Cost Breakdown
    const costBreakdown = db.prepare(`
      SELECT
        cost_type as name,
        COALESCE(SUM(total_invoice), 0) as total_invoice
      FROM job_orders
      GROUP BY cost_type
    `).all();

    // 6. Escalations / Critical Issues
    const escalations = db.prepare(`
      SELECT COUNT(id) as total_open
      FROM reports
      WHERE tipe = 'Problem Report' AND tanggapan_manager IS NULL AND ditinjau_manager = 0
    `).get();
    
    // 7. Recent Activity (Latest Tasks)
    const recentActivity = db.prepare(`
      SELECT id, judul, departemen, status, updated_at
      FROM tasks
      ORDER BY updated_at DESC
      LIMIT 10
    `).all();

    // 8. Task Trend
    const trend = db.prepare(`
      SELECT
        date(completed_at) as date,
        COUNT(id) as count
      FROM tasks
      WHERE status = 'Selesai' AND completed_at >= date('now', '-' || ? || ' days')
      GROUP BY date(completed_at)
      ORDER BY date ASC
    `).all(days);

    res.json({
      shipments: { active_count: shipments.active_count || 0 },
      tasks: {
        tugas_aktif: tasks.tugas_aktif || 0,
        overdue: tasks.overdue || 0,
        eskalasi: escalations.total_open || 0,
        total: tasks.total || 0,
        matrix: deptMatrix,
        trend: trend,
        recent: recentActivity
      },
      financial: {
        payment: {
          total_invoice: financial.total_invoice || 0,
          total_paid: financial.total_paid || 0,
          outstanding: financial.outstanding || 0
        },
        cost_breakdown: { categories: costBreakdown }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/manager/cost-variance
// Compares baseline vs actual spend per import project & cost category
router.get('/manager/cost-variance', authenticateToken, requireRole(['Manager']), (req, res, next) => {
  try {
    // 1. Per-Project Variance
    const projectVariance = db.prepare(`
      SELECT
        ip.id,
        ip.task_unique_number as project_code,
        ip.supplier,
        COALESCE(SUM(frl.baseline_amount), 0) as total_baseline,
        COALESCE(SUM(frl.actual_amount), 0) as total_actual,
        COALESCE(SUM(frl.total_estimasi), 0) as total_estimasi,
        COUNT(frl.id) as line_count
      FROM import_projects ip
      LEFT JOIN financial_request_ledger frl ON frl.import_project_id = ip.id
      GROUP BY ip.id, ip.task_unique_number, ip.supplier
      HAVING total_estimasi > 0
      ORDER BY (total_actual - total_estimasi) DESC
    `).all();

    // 2. Per-Category Variance
    const categoryVariance = db.prepare(`
      SELECT
        cost_category,
        COALESCE(SUM(total_estimasi), 0) as total_estimasi,
        COALESCE(SUM(actual_amount), 0) as total_actual,
        COUNT(id) as line_count
      FROM financial_request_ledger
      WHERE total_estimasi > 0 OR actual_amount > 0
      GROUP BY cost_category
      ORDER BY (total_actual - total_estimasi) DESC
    `).all();

    // 3. Top Overruns (ledger lines where actual significantly exceeds estimasi)
    const topOverruns = db.prepare(`
      SELECT
        frl.id,
        ip.task_unique_number as project_code,
        frl.cost_category,
        frl.vendor_nama_manual as vendor,
        frl.total_estimasi as estimasi,
        frl.actual_amount as aktual,
        (frl.actual_amount - frl.total_estimasi) as variance,
        CASE WHEN frl.total_estimasi > 0 
          THEN ROUND(((frl.actual_amount - frl.total_estimasi) / frl.total_estimasi) * 100, 1)
          ELSE 0 END as variance_pct
      FROM financial_request_ledger frl
      JOIN import_projects ip ON frl.import_project_id = ip.id
      WHERE frl.actual_amount > frl.total_estimasi AND frl.total_estimasi > 0
      ORDER BY variance DESC
      LIMIT 10
    `).all();

    // 4. Summary KPIs
    const summary = db.prepare(`
      SELECT
        COALESCE(SUM(total_estimasi), 0) as grand_estimasi,
        COALESCE(SUM(actual_amount), 0) as grand_actual,
        COUNT(CASE WHEN actual_amount > total_estimasi AND total_estimasi > 0 THEN 1 END) as overrun_count,
        COUNT(CASE WHEN actual_amount <= total_estimasi AND total_estimasi > 0 THEN 1 END) as on_budget_count
      FROM financial_request_ledger
    `).get();

    res.json({
      summary: {
        grand_estimasi: summary.grand_estimasi,
        grand_actual: summary.grand_actual,
        grand_variance: summary.grand_actual - summary.grand_estimasi,
        overrun_count: summary.overrun_count,
        on_budget_count: summary.on_budget_count
      },
      by_project: projectVariance,
      by_category: categoryVariance,
      top_overruns: topOverruns
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/manager/executive-approvals
// All items that need Manager-level approval or review
router.get('/manager/executive-approvals', authenticateToken, requireRole(['Manager']), (req, res, next) => {
  try {
    // 1. High-Value Financial Requests (any status Submitted or Checked1 with amount >= threshold)
    const THRESHOLD = 100000000; // 100 Juta IDR
    
    const highValueFinancial = db.prepare(`
      SELECT 
        fr.id, fr.request_number, fr.jenis_pengajuan, fr.estimasi_nominal,
        fr.mata_uang, fr.status, fr.departemen, fr.submitted_at,
        fr.vendor_nama_manual, fr.keterangan,
        u.nama as submitted_by_nama,
        ip.task_unique_number as project_code
      FROM financial_requests fr
      LEFT JOIN users u ON fr.submitted_by_id = u.id
      LEFT JOIN import_projects ip ON fr.import_project_id = ip.id
      WHERE fr.status IN ('Submitted', 'Checked1')
      AND fr.estimasi_nominal >= ?
      ORDER BY fr.estimasi_nominal DESC
    `).all(THRESHOLD);

    // 2. All pending PIB Requests (always need Manager visibility)
    const pendingPib = db.prepare(`
      SELECT 
        pr.id, pr.request_number, pr.aju_pib, pr.kasbon_diminta,
        pr.status, pr.created_at,
        ip.task_unique_number as project_code, ip.supplier
      FROM pib_requests pr
      LEFT JOIN import_projects ip ON pr.import_project_id = ip.id
      WHERE pr.status IN ('Submitted', 'Approved')
      ORDER BY pr.kasbon_diminta DESC
    `).all();

    // 3. Debit Notes pending settlement or with disputes
    const pendingDebitNotes = db.prepare(`
      SELECT 
        dn.id, dn.dn_number, dn.claim_kepada, dn.claim_kategori,
        dn.jumlah_klaim, dn.status, dn.mata_uang, dn.created_at,
        dn.deskripsi as catatan_klaim
      FROM debit_notes dn
      WHERE dn.status IN ('Diterbitkan', 'Negosiasi', 'Diakui')
      ORDER BY dn.jumlah_klaim DESC
    `).all();

    // 4. MTB Periodes waiting for final approval
    const pendingMtb = db.prepare(`
      SELECT 
        id, nama_periode, total_debet as total_realisasi, status, created_at
      FROM realisasi_mtb_periode
      WHERE status IN ('Submitted', 'Checked1', 'Checked3')
      ORDER BY total_realisasi DESC
    `).all();

    // 5. Summary counts
    const summary = {
      high_value_requests: highValueFinancial.length,
      pending_pib: pendingPib.length,
      pending_debit_notes: pendingDebitNotes.length,
      pending_mtb: pendingMtb.length,
      total_pending: highValueFinancial.length + pendingPib.length + pendingDebitNotes.length + pendingMtb.length,
      total_value_at_stake: highValueFinancial.reduce((s, r) => s + (r.estimasi_nominal || 0), 0) + 
                            pendingPib.reduce((s, r) => s + (r.kasbon_diminta || 0), 0) +
                            pendingDebitNotes.reduce((s, r) => s + (r.jumlah_klaim || 0), 0),
      threshold: THRESHOLD
    };

    res.json({
      summary,
      high_value_financial: highValueFinancial,
      pending_pib: pendingPib,
      pending_debit_notes: pendingDebitNotes,
      pending_mtb: pendingMtb
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
