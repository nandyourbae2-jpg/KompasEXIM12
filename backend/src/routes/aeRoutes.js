const express = require('express');
const router = express.Router();
const aeController = require('../controllers/aeController');
const aeWorkboardController = require('../controllers/aeWorkboardController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// We enforce AE department access checking for Operational role
// Since 'Administrasi Export' uses the Operational badge in UI, we can use a custom middleware
const checkAeAccess = (req, res, next) => {
  if (req.user && (req.user.departemen === 'Administrasi Export' || req.user.level_otoritas === 'Manager' || req.user.level_otoritas === 'Director')) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Access forbidden. AE Role required.' });
  }
};

router.use(authenticateToken);
router.use(checkAeAccess);

// Jobs listing alias
router.get('/jobs', aeController.getShipments);

// Workboard (Staff)
router.get('/my-jobs', aeWorkboardController.getMyJobs);
router.get('/my-work', aeWorkboardController.getMyWork);
router.get('/jobs/:jobId', aeWorkboardController.getJobById);
router.put('/jobs/:jobId/atd', aeWorkboardController.updateAtd);
router.post('/jobs/:jobId/remarks', aeWorkboardController.addRemark);
router.post('/jobs/:jobId/items/:itemId/execute', aeWorkboardController.executeActivity);

// Workboard (Supervisor)
router.get('/supervisor/queue', requireRole(['Supervisor', 'Manager', 'Director']), aeWorkboardController.getSupervisorQueue);
router.post('/supervisor/jobs/:jobId/assign', requireRole(['Supervisor', 'Manager', 'Director']), aeWorkboardController.assignJob);
router.post('/supervisor/jobs/:jobId/reassign', requireRole(['Supervisor', 'Manager', 'Director']), aeWorkboardController.reassignJob);

// Dashboard
router.get('/dashboard', aeController.getDashboard);

// Shipments
router.get('/shipments', aeController.getShipments);
router.post('/shipments', aeController.createShipment);
router.patch('/shipments/:id', aeController.updateShipment);

// Documents
router.get('/documents', aeController.getDocuments);
router.patch('/documents/:id', aeController.updateDocument);

// Follow-ups
router.get('/followups', aeController.getFollowUps);
router.post('/followups', aeController.createFollowUp);
router.patch('/followups/:id', aeController.updateFollowUp);

// Issues
router.get('/issues', aeController.getIssues);
router.post('/issues', aeController.createIssue);
router.patch('/issues/:id', aeController.updateIssue);

// Activities
router.get('/activities', aeController.getActivities);

module.exports = router;
