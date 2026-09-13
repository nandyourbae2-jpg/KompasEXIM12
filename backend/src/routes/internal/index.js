const express = require('express');
const router = express.Router();
const { internalOnly } = require('../../middleware/internalOnly');
const ApiResponse = require('../../utils/ApiResponse');
const db = require('../../database/db');

router.use(internalOnly);

router.get('/health', async (req, res, next) => {
  try {
    // Simple DB check to ensure health
    db.prepare('SELECT 1').get();
    ApiResponse.send(req, res, { status: 'Healthy', version: '1.0.0' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
