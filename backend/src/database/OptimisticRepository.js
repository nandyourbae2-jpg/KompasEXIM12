const OptimisticLockHelper = require('../utils/OptimisticLockHelper');

/**
 * Abstract Base Class for Repositories implementing Optimistic Concurrency Control.
 * Does not modify production schemas. Establishes the foundation for future V2 domains.
 */
class OptimisticRepository {
  /**
   * @param {string} tableName - The raw table name (for SQLite) or model name (Prisma)
   */
  constructor(tableName) {
    if (!tableName) throw new Error('OptimisticRepository requires a tableName');
    this.tableName = tableName;
  }

  /**
   * Helper to generate a safe SQL update statement with version checks.
   * 
   * @param {string} id - Record ID
   * @param {number} currentVersion - The expected current version
   * @param {object} updates - Key-value pair of columns to update
   * @returns {object} { query, params }
   */
  buildOptimisticUpdateSql(id, currentVersion, updates) {
    if (currentVersion === undefined || currentVersion === null) {
      throw new Error(`OptimisticRepository: currentVersion is required for updating ${this.tableName}`);
    }

    const setClauses = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = ?`);
      params.push(value);
    }
    
    // Automatically increment the version column
    setClauses.push('version = version + 1');
    
    const query = `
      UPDATE ${this.tableName} 
      SET ${setClauses.join(', ')} 
      WHERE id = ? AND version = ?
    `;
    
    params.push(id, currentVersion);
    
    return { query, params };
  }

  /**
   * Executes the raw SQLite query inside the transaction context and asserts OCC.
   * @param {TransactionContext} txContext 
   * @param {string} query 
   * @param {Array} params 
   * @param {string|number} id 
   */
  executeOptimisticUpdate(txContext, query, params, id) {
    // We assume txContext.db or the underlying db driver exposes a `run` or `exec`
    // Since we are using better-sqlite3 through db.js, prepare() and run() is the pattern.
    const stmt = txContext.db.prepare(query);
    const result = stmt.run(...params);
    
    OptimisticLockHelper.assertUpdated(result.changes, this.tableName, id);
    return result;
  }
}

module.exports = OptimisticRepository;
