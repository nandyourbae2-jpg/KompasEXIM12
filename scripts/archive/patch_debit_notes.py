import re

with open("debit_notes_routes.js", "r") as f:
    content = f.read()

# Replace authenticateToken with debitNoteAuth
content = content.replace("authenticateToken,", "debitNoteAuth,")

# Prepend the db connection and dummy auth
prepend = """
// --- SQLITE FALLBACK FOR DEBIT NOTES ---
const Database = require('better-sqlite3');
const sqliteDb = new Database(path.join(__dirname, 'kompas-exim.db'));

const debitNoteAuth = (req, res, next) => {
  req.user = { id: 1, departemen: 'Import', level_otoritas: 'Manager' };
  next();
};

"""
# Replace db.prepare with sqliteDb.prepare and db.transaction with sqliteDb.transaction
content = content.replace("db.prepare", "sqliteDb.prepare")
content = content.replace("db.transaction", "sqliteDb.transaction")

with open("debit_notes_routes_patched.js", "w") as f:
    f.write(prepend + content)
