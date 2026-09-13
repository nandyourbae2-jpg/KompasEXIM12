const EventDispatcher = require('./EventDispatcher');

class DomainEvents {
  /**
   * Safely queues a DomainEvent to be published ONLY if the transaction commits successfully.
   * If the transaction rolls back, the event is silently discarded.
   *
   * @param {TransactionContext} txContext - From TransactionManager
   * @param {DomainEvent} domainEvent - The event to publish
   */
  static dispatchAfterCommit(txContext, domainEvent) {
    if (!txContext || typeof txContext.onCommit !== 'function') {
      throw new Error('dispatchAfterCommit requires a valid TransactionContext');
    }
    
    if (!domainEvent) {
      throw new Error('dispatchAfterCommit requires a valid DomainEvent');
    }

    // Register a post-commit hook on the current transaction
    txContext.onCommit(() => {
      EventDispatcher.publish(domainEvent);
    });
  }
}

module.exports = DomainEvents;
