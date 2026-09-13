const express = require('express');
const router = express.Router();

router.use('/commitments', require('./commitments'));
router.use('/source', require('./sourceRoutes'));
router.use('/ae', require('./aeRoutes'));
router.use('/ae-assignment', require('./aeAssignmentRoutes'));
router.use('/ae-workbench', require('./aeWorkbenchRoutes'));
router.use('/settings', require('./settingsRoutes'));
router.use('/ao-workboard', require('../aoWorkboardRoutes'));
module.exports = router;
