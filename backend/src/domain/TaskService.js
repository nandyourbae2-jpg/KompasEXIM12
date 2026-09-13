/**
 * TaskService — Centralized Task Domain Service
 * 
 * Single Source of Truth for all task-related business logic:
 *   - Task status counts (active, overdue, escalation)
 *   - Staff performance metrics (completion rate per staff)
 *   - Department health scoring
 *   - Task completion trends
 * 
 * Consumed by:
 *   - Supervisor: /api/control-tower/stats, /api/control-tower/staff-performance
 *   - Manager: /api/manager/dashboard
 *   - Future: Notifications, Analytics, Reporting
 */

const db = require('../database/db');

class TaskService {

  // ─── Task KPI Aggregations ───────────────────────────────────────────────

  /**
   * Returns task statistics for a given department.
   * 
   * @param {string} departemen - Department name (e.g., 'Import')
   * @returns {{ tugas_aktif: number, overdue: number, eskalasi: number }}
   */
  static getTaskStats(departemen) {
    const now = new Date().toISOString().slice(0, 10);

    const tugasAktif = db.prepare(`
      SELECT COUNT(*) as n FROM tasks
      WHERE departemen = ? AND status != 'Selesai'
    `).get(departemen).n;

    const overdue = db.prepare(`
      SELECT COUNT(*) as n FROM tasks
      WHERE departemen = ? AND status != 'Selesai' AND tenggat < ?
    `).get(departemen, now).n;

    const eskalasi = db.prepare(`
      SELECT COUNT(*) as n FROM tasks
      WHERE departemen = ? AND sumber_tugas = 'Escalation' AND status != 'Selesai'
    `).get(departemen).n;

    return { tugas_aktif: tugasAktif, overdue, eskalasi };
  }

  /**
   * Returns task statistics across ALL departments.
   * Used by the Manager dashboard for ERP-wide executive view.
   */
  static getGlobalTaskStats() {
    const now = new Date().toISOString().slice(0, 10);

    const tugasAktif = db.prepare(`
      SELECT COUNT(*) as n FROM tasks WHERE status != 'Selesai'
    `).get().n;

    const overdue = db.prepare(`
      SELECT COUNT(*) as n FROM tasks
      WHERE status != 'Selesai' AND tenggat < ?
    `).get(now).n;

    const eskalasi = db.prepare(`
      SELECT COUNT(*) as n FROM tasks
      WHERE sumber_tugas = 'Escalation' AND status != 'Selesai'
    `).get().n;

    const totalTasks = db.prepare(`SELECT COUNT(*) as n FROM tasks`).get().n;

    return { tugas_aktif: tugasAktif, overdue, eskalasi, total: totalTasks };
  }

  // ─── Staff Count ─────────────────────────────────────────────────────────

  /**
   * Returns the count of active staff in a department.
   */
  static getStaffCount(departemen) {
    return db.prepare(`
      SELECT COUNT(*) as n FROM users
      WHERE departemen = ? AND level_otoritas = 'Staff Dept' AND status_aktif = 1
    `).get(departemen).n;
  }

  // ─── Staff Performance ───────────────────────────────────────────────────

  /**
   * Returns per-staff performance metrics for a department.
   * Used by both Supervisor and Manager dashboards.
   * 
   * @param {string} departemen - Department name
   * @returns {Array<{ id, nama, employee_id, tipe_karyawan, tugas_aktif, selesai, overdue, completion_rate }>}
   */
  static getStaffPerformance(departemen) {
    const now = new Date().toISOString().slice(0, 10);

    const staffList = db.prepare(`
      SELECT id, nama, employee_id, tipe_karyawan
      FROM users
      WHERE departemen = ? AND level_otoritas = 'Staff Dept' AND status_aktif = 1
      ORDER BY nama ASC
    `).all(departemen);

    return staffList.map(staff => {
      const tasks = db.prepare('SELECT status, tenggat FROM tasks WHERE assignee_id = ?').all(staff.id);

      const aktif   = tasks.filter(t => t.status !== 'Selesai').length;
      const selesai = tasks.filter(t => t.status === 'Selesai').length;
      const overdue = tasks.filter(t => t.status !== 'Selesai' && t.tenggat && t.tenggat < now).length;
      const total   = tasks.length;
      const rate    = total > 0 ? Math.round((selesai / total) * 100) : 0;

      return {
        id:              staff.id,
        nama:            staff.nama,
        employee_id:     staff.employee_id,
        tipe_karyawan:   staff.tipe_karyawan,
        tugas_aktif:     aktif,
        selesai,
        overdue,
        completion_rate: rate,
      };
    });
  }

  // ─── Department Health ───────────────────────────────────────────────────

  /**
   * Calculates health score for each department.
   * Health = 100 - (overdue / total * 100), clamped to [0, 100].
   * 
   * Used by Manager dashboard "Department Health" widget.
   */
  static getDepartmentHealth() {
    const depts = ['Import', 'Export', 'Administrasi Export (AE)', 'Account Officer'];
    const now = new Date().toISOString().slice(0, 10);

    return depts.map(dept => {
      const total = db.prepare(`
        SELECT COUNT(*) as n FROM tasks WHERE departemen = ?
      `).get(dept).n;

      if (total === 0) {
        return {
          department: dept,
          score: 100,
          status: 'Sangat Baik',
          overdue_count: 0,
          total_tasks: 0,
        };
      }

      const overdueCount = db.prepare(`
        SELECT COUNT(*) as n FROM tasks
        WHERE departemen = ? AND status != 'Selesai' AND tenggat < ?
      `).get(dept, now).n;

      const scoreNum = Math.max(0, Math.round(100 - (overdueCount / total * 100)));

      let status = 'Sangat Baik';
      if (scoreNum < 70) status = 'Perlu Perhatian';
      if (scoreNum < 40) status = 'Kritis';

      return {
        department: dept,
        score: scoreNum,
        status,
        overdue_count: overdueCount,
        total_tasks: total,
      };
    });
  }

  // ─── Task Completion Trend ───────────────────────────────────────────────

  /**
   * Returns daily task completion counts for the last N days.
   * Used by Manager dashboard "Operational Performance" chart.
   * 
   * @param {number} numDays - Number of days to look back (default 7)
   */
  static getCompletionTrend(numDays = 7) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - numDays + 1);
    const startStr = startDate.toISOString().slice(0, 10);

    // Query tasks completed within the date range
    const completedTasks = db.prepare(`
      SELECT DATE(updated_at) as completion_date, COUNT(*) as count
      FROM tasks
      WHERE status = 'Selesai' AND DATE(updated_at) >= ?
      GROUP BY DATE(updated_at)
      ORDER BY DATE(updated_at) ASC
    `).all(startStr);

    // Build a complete array with zero-filled days
    const completionMap = {};
    completedTasks.forEach(row => {
      completionMap[row.completion_date] = row.count;
    });

    const result = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short',
        ...(numDays > 90 ? { year: '2-digit' } : {})
      });

      result.push({
        date: dateStr,
        label,
        completed: completionMap[dateStr] || 0,
      });
    }

    return result;
  }
}

module.exports = TaskService;
