const express = require('express');
const router = express.Router();

router.use('/ae', require('../aeRoutes'));
router.use('/ao', require('../aoRoutes'));

router.use('/', require('./auth'));
router.use('/', require('./master'));
router.use('/', require('./documents'));
router.use('/', require('./containerCosts'));
router.use('/', require('./financialRequestLedger'));
router.use('/', require('./staff'));
router.use('/', require('./tasks'));
router.use('/', require('./vendors'));
router.use('/', require('./importOperations'));
router.use('/', require('./financials'));
router.use('/', require('./reports'));
router.use('/', require('./manager'));
router.use('/', require('./aoModule'));

module.exports = router;
