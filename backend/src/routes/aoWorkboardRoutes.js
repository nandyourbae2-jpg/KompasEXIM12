const express = require('express');
const router = express.Router();
const aoWorkboardController = require('../controllers/aoWorkboardController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// ==========================================
// SUPERVISOR ENDPOINTS
// ==========================================
router.get('/supervisor/handovers', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.getHandovers);
router.post('/supervisor/handovers/:id/accept', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.acceptHandover);
router.get('/supervisor/tasks', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.getSupervisorTasks);
router.post('/supervisor/tasks', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.createSupervisorTask);
router.put('/supervisor/tasks/:id/assign', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.assignTask);
router.get('/supervisor/workload', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.getSupervisorWorkload);
router.put('/supervisor/jobs/:job_id/alerts', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.updateOperationalAlerts);
// AE → AO Pairing Center
router.get('/supervisor/pairing-jobs', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.getPairingJobs);
router.put('/supervisor/jobs/:job_id/pair', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.pairJob);
router.get('/supervisor/ao-staff', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.getAoStaffList);
router.get('/supervisor/dscs-staff', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.getDscsStaffList);

// Doc Planner
router.get('/supervisor/doc-planner/jobs', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.getDocPlannerJobs);
router.put('/supervisor/jobs/:job_id/doc-plan', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.updateDocPlan);

// ==========================================
// STAFF AO ENDPOINTS (PHASE 13)
// ==========================================
// Legacy task-based endpoints (kept for backward compat)
router.get('/staff/tasks', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.getStaffTasks);
router.put('/staff/tasks/:id/status', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.updateTaskStatus);

// Phase 13: My Jobs — 7 Excel Daily Field Groups
router.get('/staff/my-jobs', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.getStaffMyJobs);
router.put('/staff/jobs/:job_id/execution', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.updateJobExecution);

// Phase 13: Staff Handover Inbox — Terima Handover dari Ka Vicky
router.get('/staff/handovers', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.getStaffHandovers);
router.post('/staff/handovers/:id/accept', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.acceptStaffHandover);

// ==========================================
// DSCS WORKSPACE ENDPOINTS (KHUSUS ERICA)
// ==========================================
// Legacy endpoint (kept for backward compat)
router.get('/dscs/tasks', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.getDscsTasks);
router.put('/dscs/tasks/:id/status', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.updateTaskStatus);

// Phase 13: DSCS Personal Workspace — my-work (strict RBAC: Erica-only for Staff Dept)
router.get('/dscs/my-work', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.getDscsMyWork);
router.put('/dscs/jobs/:job_id/update', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.updateDscsJob);
router.get('/dscs/jobs/:job_id/history', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.getDscsHistory);

// ==========================================
// PHASE 15: STAGES MONITORING & COMPLETED VAULT
// ==========================================
router.get('/supervisor/stages-monitoring', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.getStagesMonitoring);
router.put('/supervisor/jobs/:job_id/stage', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.updateDocumentStage);
router.get('/supervisor/completed-shipments', requireRole(['Supervisor', 'Manager', 'Director']), aoWorkboardController.getCompletedShipments);
router.put('/staff/jobs/:job_id/checklist', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.updateDocumentChecklist);
router.put('/jobs/:job_id/complete', requireRole(['Staff Dept', 'Supervisor', 'Manager', 'Director']), aoWorkboardController.completeJob);

module.exports = router;

