const db = require('./src/database/db');
const user = db.prepare('SELECT * FROM users WHERE id = 101').get();
console.log(user);
