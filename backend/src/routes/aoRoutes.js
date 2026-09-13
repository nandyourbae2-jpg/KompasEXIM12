const express = require('express');
const router = express.Router();
const aoController = require('../controllers/aoController');

// Middleware to ensure user is Account Officer
const checkAoAccess = (req, res, next) => {
  if (req.user && (req.user.departemen === 'Account Officer' || req.user.level_otoritas === 'Manager')) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Access denied: Account Officer role required' });
  }
};

router.use(checkAoAccess);

router.get('/dashboard', aoController.getDashboard);
router.get('/customers', aoController.getCustomers);
router.get('/invoices', aoController.getInvoices);

router.get('/collections', aoController.getCollections);
router.post('/collections', aoController.createCollection);
router.patch('/collections/:id', aoController.updateCollection);

router.get('/issues', aoController.getIssues);
router.post('/issues', aoController.createIssue);
router.patch('/issues/:id', aoController.updateIssue);

router.get('/activities', aoController.getActivities);

module.exports = router;
