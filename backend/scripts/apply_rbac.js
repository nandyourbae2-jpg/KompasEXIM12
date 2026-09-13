const fs = require('fs');

const indexPath = 'index.js';
let content = fs.readFileSync(indexPath, 'utf8');

const rbacMatrix = [
  { prefix: '/api/staff', roles: "['Manager', 'Supervisor']" },
  { prefix: '/api/departemen', roles: "['Manager', 'Supervisor']" },
  { prefix: '/api/document-types', roles: "['Manager', 'Supervisor']" },
  { prefix: '/api/vendors', roles: "['Manager', 'Supervisor']" },
  { prefix: '/api/documents', roles: "['Manager', 'Supervisor']" },
  { prefix: '/api/tasks', roles: "['Manager', 'Supervisor']", methods: ['post', 'delete'] },
  { prefix: '/api/tasks/:id/status', roles: "['Manager', 'Supervisor', 'Staff Dept']", methods: ['patch'] },
  { prefix: '/api/tasks/:id/catatan', roles: "['Manager', 'Supervisor', 'Staff Dept']", methods: ['patch'] },
  { prefix: '/api/import-projects', roles: "['Manager', 'Supervisor', 'Staff Dept']" },
  { prefix: '/api/import-shipments', roles: "['Manager', 'Supervisor', 'Staff Dept']" },
  { prefix: '/api/containers', roles: "['Manager', 'Supervisor', 'Staff Dept']" },
  { prefix: '/api/dokumen-monitoring', roles: "['Manager', 'Supervisor', 'Staff Dept']" },
  { prefix: '/api/job-orders', roles: "['Manager', 'Supervisor', 'Staff Dept']" },
  { prefix: '/api/debit-notes', roles: "['Manager', 'Supervisor', 'Staff Dept']" },
  { prefix: '/api/mtb-periode', roles: "['Manager', 'Supervisor', 'Staff Dept']" },
  { prefix: '/api/mtb-transaksi', roles: "['Manager', 'Supervisor', 'Staff Dept']" },
  { prefix: '/api/pib', roles: "['Manager', 'Supervisor', 'Staff Dept']" },
  { prefix: '/api/reports', roles: "['Manager', 'Supervisor', 'Staff Dept']", methods: ['post'] }
];

function injectRbac(regexMatch, url, existingMiddlewares, method) {
  if (existingMiddlewares.includes('requireRole')) return regexMatch;
  let rule = rbacMatrix.find(r => r.prefix === url && (!r.methods || r.methods.includes(method)));
  if (!rule) rule = rbacMatrix.find(r => url.startsWith(r.prefix) && (!r.methods || r.methods.includes(method)));
  const matchedRoles = rule ? rule.roles : "['Manager']";
  return regexMatch.replace(/authenticateToken\s*,/, `authenticateToken, requireRole(${matchedRoles}),`);
}

const routeRegex = /app\.(post|patch|put|delete)\('([^']+)',\s*(.*?catchErrors.*?)\)/g;
let count = 0;
content = content.replace(routeRegex, (match, method, url, middlewares) => {
  if (url === '/api/login' || url === '/api/log-error' || url === '/api/master-kategori-biaya-manual') return match;
  if (middlewares.includes('authenticateToken')) {
    const newMatch = injectRbac(match, url, middlewares, method);
    if (newMatch !== match) count++;
    return newMatch;
  }
  return match;
});

// Remove authorizeDepartment inside /api/reports route as we'll do it centrally if needed, 
// wait we are just injecting requireRole for now.

fs.writeFileSync(indexPath, content);
console.log('Updated ' + count + ' routes with requireRole.');
