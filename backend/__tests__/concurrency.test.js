const { TransactionManager } = require('../src/database/TransactionManager');
const db = require('../src/database/db');
const OptimisticRepository = require('../src/database/OptimisticRepository');
const { ConcurrencyConflictError, AuthError } = require('../src/utils/errors');
const RequestContext = require('../src/utils/RequestContext');

// Set up a mock repository extending OptimisticRepository
class TestOptimisticRepository extends OptimisticRepository {
  constructor() {
    super('mock_test_table');
  }

  // Simulate updating the version.
  updateData(txContext, id, currentVersion, data) {
    const { query, params } = this.buildOptimisticUpdateSql(id, currentVersion, { data });
    return this.executeOptimisticUpdate(txContext, query, params, id);
  }
}

// Utility to sleep and allow setImmediate/Promises to flush
const flushPromises = () => new Promise(setImmediate);

describe('Concurrency Strategy', () => {
  beforeAll(() => {
    // Create the test table
    db.exec(`
      CREATE TABLE IF NOT EXISTS mock_test_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        version INTEGER DEFAULT 1
      )
    `);
  });

  afterAll(() => {
    db.exec('DROP TABLE IF EXISTS mock_test_table');
  });

  beforeEach(() => {
    db.exec('DELETE FROM mock_test_table');
    db.prepare('INSERT INTO mock_test_table (id, data, version) VALUES (?, ?, ?)').run(1, 'initial', 1);
  });

  test('✅ Lost Update Prevention: Valid update successfully increments version', async () => {
    const repo = new TestOptimisticRepository();
    
    await RequestContext.run({ correlationId: 'trace-conc-1' }, async () => {
      await TransactionManager.execute(async (tx) => {
        repo.updateData(tx, 1, 1, 'updated-1');
      });
    });

    const row = db.prepare('SELECT * FROM mock_test_table WHERE id = 1').get();
    expect(row.data).toBe('updated-1');
    expect(row.version).toBe(2);
  });

  test('✅ Retry Strategy: Exhausted retries return 409 Conflict', async () => {
    const repo = new TestOptimisticRepository();
    
    let attemptCount = 0;

    await RequestContext.run({ correlationId: 'trace-conc-2' }, async () => {
      // Expect the overall transaction block to throw a ConcurrencyConflictError after exhausting retries
      await expect(
        TransactionManager.execute(async (tx) => {
          attemptCount++;
          // We always pass expectedVersion = 1, but someone else already updated it to 2!
          // This ensures the update ALWAYS fails and triggers retries.
          // Force set version to 2 before trying
          db.prepare('UPDATE mock_test_table SET version = 2 WHERE id = 1').run();
          
          repo.updateData(tx, 1, 1, 'updated-2');
        })
      ).rejects.toThrow(ConcurrencyConflictError);
    });

    // 1 initial attempt + 3 retries = 4 attempts total
    expect(attemptCount).toBe(4);
  });

  test('✅ Non-Retriable Errors: Fail immediately without retrying', async () => {
    let attemptCount = 0;

    await RequestContext.run({ correlationId: 'trace-conc-3' }, async () => {
      await expect(
        TransactionManager.execute(async (tx) => {
          attemptCount++;
          throw new AuthError('Simulated Auth Error');
        })
      ).rejects.toThrow(AuthError);
    });

    // Should only attempt once, no retries
    expect(attemptCount).toBe(1);
  });

  test('✅ Retry Success: Transaction recovers after initial conflict', async () => {
    const repo = new TestOptimisticRepository();
    
    let attemptCount = 0;

    await RequestContext.run({ correlationId: 'trace-conc-4' }, async () => {
      await TransactionManager.execute(async (tx) => {
        attemptCount++;
        
        // Read current state
        const currentVersion = db.prepare('SELECT version FROM mock_test_table WHERE id = 1').get().version;

        if (attemptCount === 1) {
          // Simulate a stale read by updating it directly. 
          // Note: Because this runs on the same SQLite connection inside the BEGIN/COMMIT block,
          // when the ConcurrencyConflictError is thrown below, this 99 update will be rolled back too!
          // So on retry 2, the version will be back to 1, and the update will succeed to 2.
          db.prepare('UPDATE mock_test_table SET version = 99 WHERE id = 1').run();
        }

        // Try to update with what we think is the current version
        repo.updateData(tx, 1, currentVersion, 'updated-4');
      });
    });

    // 1 initial failure (expected 1, got 99) + 1 successful retry = 2 attempts
    expect(attemptCount).toBe(2);
    
    const row = db.prepare('SELECT * FROM mock_test_table WHERE id = 1').get();
    expect(row.data).toBe('updated-4');
    expect(row.version).toBe(2); // 1 + 1 (since the 99 update was rolled back)
  });
});
