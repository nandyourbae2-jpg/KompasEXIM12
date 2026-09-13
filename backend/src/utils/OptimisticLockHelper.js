const { ConcurrencyConflictError } = require('./errors');
const logger = require('./logger');

class OptimisticLockHelper {
  /**
   * Asserts that exactly one row was updated.
   * If zero rows were updated, throws a ConcurrencyConflictError.
   * 
   * @param {number} affectedRows - Number of rows updated by the query
   * @param {string} entityName - Name of the entity for logging
   * @param {string|number} id - The ID of the entity that failed
   */
  static assertUpdated(affectedRows, entityName, id) {
    if (affectedRows === 0) {
      logger.warn('CONCURRENCY_CONFLICT', { entityName, id }, 'OPTIMISTIC_LOCK');
      throw new ConcurrencyConflictError(
        `${entityName} (ID: ${id}) was modified by another transaction. Please refresh and try again.`
      );
    }
    
    if (affectedRows > 1) {
      logger.error('OPTIMISTIC_LOCK_ANOMALY', { entityName, id, affectedRows }, 'OPTIMISTIC_LOCK');
      throw new Error(`Critical Error: Expected to update 1 row, but updated ${affectedRows}.`);
    }
  }
}

module.exports = OptimisticLockHelper;
