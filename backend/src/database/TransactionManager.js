const db = require('./db');
const crypto = require('crypto');
const RequestContext = require('../utils/RequestContext');
const logger = require('../utils/logger');
const { ConcurrencyConflictError } = require('../utils/errors');

class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  acquire(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const lockAcquired = () => {
        clearTimeout(timeoutId);
        resolve(this.release.bind(this));
      };

      const timeoutId = setTimeout(() => {
        const index = this.queue.indexOf(lockAcquired);
        if (index > -1) this.queue.splice(index, 1);
        reject(new Error('Lock Timeout: Could not acquire transaction lock within 5000ms. Possible deadlock or high contention.'));
      }, timeoutMs);

      if (!this.locked) {
        this.locked = true;
        lockAcquired();
      } else {
        this.queue.push(lockAcquired);
      }
    });
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.locked = false;
    }
  }
}

const sqliteMutex = new Mutex();

class TransactionContext {
  constructor(dbInstance, options = {}) {
    this.db = dbInstance;
    this.onCommitHooks = [];
    this.transactionId = options.transactionId || crypto.randomUUID();
    this.correlationId = options.correlationId || this.transactionId;
    this.requestId = options.requestId || null;
  }

  onCommit(callback) {
    this.onCommitHooks.push(callback);
  }

  async runCommitHooks() {
    for (const hook of this.onCommitHooks) {
      try {
        await hook();
      } catch (err) {
        logger.error(`Error in onCommit hook [Tx: ${this.transactionId}]:`, { error: err.message });
      }
    }
  }
}

class TransactionManager {
  static _isRetriable(error) {
    if (error instanceof ConcurrencyConflictError) return true;
    if (error.code === 'SQLITE_BUSY') return true;
    if (error.code === 'P2034') return true; // Prisma / PostgreSQL Deadlock
    if (error.message && error.message.includes('Lock Timeout')) return true;
    return false;
  }

  static async _sleepWithJitter(baseDelayMs) {
    const jitter = Math.random() * baseDelayMs * 0.5; // Up to 50% jitter
    const delay = baseDelayMs + jitter;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Executes a database transaction gracefully handling async logic.
   * Includes automatic Retry Strategy for Concurrency errors.
   */
  static async execute(callback, existingContext = null, options = {}) {
    // Nested Transaction Policy: Reuse existing context if provided
    // Retries are ONLY handled by the outermost transaction.
    if (existingContext instanceof TransactionContext) {
      return callback(existingContext);
    }

    const MAX_RETRIES = 3;
    let attempt = 0;
    let currentBackoff = 50;

    while (true) {
      attempt++;
      const txContext = new TransactionContext(db, options);
      let release;

      try {
        release = await sqliteMutex.acquire(5000);
        RequestContext.set('transactionId', txContext.transactionId);
        
        const transactionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Transaction Timeout [Tx: ${txContext.transactionId}]: Execution exceeded 10000ms limit.`)), 10000)
        );

        db.exec('BEGIN');
        
        const execution = (async () => {
          const result = await callback(txContext);
          db.exec('COMMIT');
          return result;
        })();

        const result = await Promise.race([execution, transactionTimeout]);
        
        // Run hooks ONLY after successful commit
        await txContext.runCommitHooks();
        
        return result;
      } catch (error) {
        try {
          db.exec('ROLLBACK');
        } catch (rollbackErr) {
          if (rollbackErr.message !== 'cannot rollback - no transaction is active') {
            logger.error(`Failed to rollback transaction [Tx: ${txContext.transactionId}]:`, { error: rollbackErr.message });
          }
        }

        // Retry Strategy
        if (this._isRetriable(error) && attempt <= MAX_RETRIES) {
          logger.warn(`Concurrency conflict detected. Retrying transaction...`, { attempt, maxRetries: MAX_RETRIES, error: error.message }, 'TRANSACTION_MANAGER');
          await this._sleepWithJitter(currentBackoff);
          currentBackoff *= 3; // Exponential backoff (50ms, 150ms, 450ms)
          continue; // Try again
        }

        // Non-retriable or max retries exhausted
        if (this._isRetriable(error)) {
          logger.error(`Transaction failed permanently after ${attempt} attempts due to concurrency conflicts.`, { error: error.message }, 'TRANSACTION_MANAGER');
          // Ensure we always return the standard ConcurrencyConflictError 409 if we exhausted retries
          if (!(error instanceof ConcurrencyConflictError)) {
            throw new ConcurrencyConflictError('The system is currently experiencing high contention. Please try again.');
          }
        }
        
        throw error;
      } finally {
        RequestContext.set('transactionId', null);
        if (release) release();
      }
    }
  }
}

module.exports = { TransactionManager, TransactionContext };
