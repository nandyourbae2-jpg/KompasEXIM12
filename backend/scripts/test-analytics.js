const { db } = require('../src/database/db');
const ShipmentService = require('../src/domain/ShipmentService');

const res = ShipmentService.getAnalytics();
console.log(JSON.stringify(res, null, 2));
