const { TransactionManager } = require('../src/database/TransactionManager');
const db = require('../src/database/db');
const RequestContext = require('../src/utils/RequestContext');
const DomainEvent = require('../src/events/DomainEvent');
const DomainEvents = require('../src/events/DomainEvents');
const EventRegistry = require('../src/events/EventRegistry');
const TestEventSubscriber = require('../src/subscribers/TestDomain/TestEventSubscriber');

// Initialize the subscriber so it listens to the emitter
TestEventSubscriber.init();

// Utility to sleep and allow setImmediate/Promises to flush
const flushPromises = () => new Promise(setImmediate);

describe('Domain Event Foundation', () => {
  beforeEach(() => {
    TestEventSubscriber.executions = [];
  });

  test('✅ Post-Commit Firing Test: Event is published only after COMMIT', async () => {
    const testCorrelationId = 'trace-123';
    
    await RequestContext.run({ correlationId: testCorrelationId }, async () => {
      await TransactionManager.execute(async (tx) => {
        const event = new DomainEvent(EventRegistry.TEST_EVENT_FIRED, 'agg-1', { data: 'test-1' });
        
        DomainEvents.dispatchAfterCommit(tx, event);
        
        // Assert event is NOT yet fired while still inside the transaction
        expect(TestEventSubscriber.executions.length).toBe(0);
      });
      
      // Wait for EventDispatcher's setImmediate to flush
      await flushPromises();
      
      // Assert it fired after commit
      expect(TestEventSubscriber.executions.length).toBe(1);
      expect(TestEventSubscriber.executions[0].payload.data).toBe('test-1');
    });
  });

  test('✅ Rollback Safety Test: Event is DESTROYED if transaction rolls back', async () => {
    try {
      await TransactionManager.execute(async (tx) => {
        const event = new DomainEvent(EventRegistry.TEST_EVENT_FIRED, 'agg-2', { data: 'test-2' });
        DomainEvents.dispatchAfterCommit(tx, event);
        
        // Intentionally throw to trigger rollback
        throw new Error('Simulated DB Failure');
      });
    } catch (err) {
      // Expected
    }

    await flushPromises();

    // Assert it never fired
    expect(TestEventSubscriber.executions.length).toBe(0);
  });

  test('✅ Trace Propagation Test: Subscriber seamlessly inherits original correlationId', async () => {
    const originalCorrelationId = 'trace-456';
    
    await RequestContext.run({ correlationId: originalCorrelationId }, async () => {
      await TransactionManager.execute(async (tx) => {
        const event = new DomainEvent(EventRegistry.TEST_EVENT_FIRED, 'agg-3', { data: 'test-3' });
        DomainEvents.dispatchAfterCommit(tx, event);
      });
    });

    await flushPromises();

    // The subscriber captures the `RequestContext.get('correlationId')` inside its callback
    expect(TestEventSubscriber.executions.length).toBe(1);
    expect(TestEventSubscriber.executions[0].correlationId).toBe(originalCorrelationId);
  });

  test('✅ Subscriber Isolation: Failing subscriber does not crash the process', async () => {
    await RequestContext.run({ correlationId: 'trace-789' }, async () => {
      await TransactionManager.execute(async (tx) => {
        const event = new DomainEvent(EventRegistry.TEST_EVENT_FIRED, 'agg-4', { fail: true });
        DomainEvents.dispatchAfterCommit(tx, event);
      });
    });

    await flushPromises();

    // Process shouldn't crash, but it won't be pushed to executions because it threw early
    expect(TestEventSubscriber.executions.length).toBe(0);
  });
});
