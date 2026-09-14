const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 104, role: 'Supervisor', departemen: 'Account Officer' }, 'kompas-exim-secret-key-2026');
console.log(token);
