const path = require('path');
const fs = require('fs');
const db = process.env.NODE_ENV === 'test' ? require('./__tests__/mockDb') : require('./src/database/db');