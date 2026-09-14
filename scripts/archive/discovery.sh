echo "=== 1. ROUTES ==="
grep -rn "<Route path=" src/App.jsx | sed -e 's/^[ \t]*//'

echo -e "\n=== 2. ENDPOINTS ==="
grep -rn "router\.\(get\|post\|patch\|delete\|put\)\|app\.\(get\|post\|patch\|delete\|put\)" backend/index.js backend/src/routes/ 2>/dev/null | sed -e 's/^[ \t]*//'

echo -e "\n=== 3. TABLES ==="
node -e "
const db = require('./backend/src/database/db');
const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\").all();
tables.forEach(t => console.log(t.name));
"

echo -e "\n=== 4. USERS ==="
node -e "
const db = require('./backend/src/database/db');
const users = db.prepare('SELECT employee_id, nama, level_otoritas, departemen FROM users').all();
console.table(users);
"

echo -e "\n=== 5. TEST CONFIG ==="
ls -la backend/*.db 2>/dev/null || echo "No DB files found"
cat package.json | grep -A 3 "test"
