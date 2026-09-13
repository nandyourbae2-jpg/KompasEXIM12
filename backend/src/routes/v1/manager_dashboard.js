const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../../middleware/auth');

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
      WHERE report_type = 'Problem Report' AND status = 'Open'
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

module.exports = router;
