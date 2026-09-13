const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 101, level_otoritas: 'Staff Dept' }, 'kompas_exim_super_secret_key');
const user = jwt.verify(token, 'kompas_exim_super_secret_key');
console.log("req.user.id:", user.id, typeof user.id);
console.log("job.ae_assignee_id:", 101, typeof 101);
console.log("!== :", user.id !== 101);
