const EventEmitter = require('events');
const RequestContext = require('../utils/RequestContext');
const logger = require('../utils/logger');

// Global Singleton EventEmitter
const emitter = new EventEmitter();
// Increase limit if many subscribers are attached to the same event
emitter.setMaxListeners(20);

class EventDispatcher {
  /**
   * Subscribes a handler to a specific DomainEvent.
   * Ensures execution is asynchronous, isolated, and traceable.
   *
   * @param {string} eventName - From EventRegistry
   * @param {function} handler - The async callback function handling the event
   */
  static subscribe(eventName, handler) {
    emitter.on(eventName, (domainEvent) => {
      // 1. Asynchronous execution (setImmediate prevents blocking the HTTP loop/Transaction Commit)
      setImmediate(async () => {
        // 2. Trace Context Injection
        // Wrap subscriber execution in a new context seeded with the event's correlationId
        RequestContext.run({ correlationId: domainEvent.correlationId }, async () => {
          try {
            logger.debug(`Subscriber handling event: ${eventName}`, { eventId: domainEvent.eventId }, 'EVENT_BUS');
            
            // 3. Subscriber Isolation
            await handler(domainEvent);
            
            logger.info(`Event successfully processed: ${eventName}`, { eventId: domainEvent.eventId }, 'EVENT_BUS');
          } catch (error) {
            // 4. Retry and Failure Policy (Currently logging, DLQ future)
            logger.error(`Subscriber failed to process event: ${eventName}`, { 
              eventId: domainEvent.eventId,
              error: error.message,
              stack: error.stack 
            }, 'EVENT_BUS');
            
            // TODO: In the future, route to a Dead-Letter Queue (DLQ) table or RabbitMQ here.
          }
        });
      });
    });
  }

  /**
   * Publishes a DomainEvent to the internal bus immediately.
   * NOTE: Domain Services should rarely call this directly. 
   * They should use `DomainEvents.dispatchAfterCommit(tx, event)` instead.
   *
   * @param {DomainEvent} domainEvent 
   */
  static publish(domainEvent) {
    if (!domainEvent || !domainEvent.eventName) {
      throw new Error('Invalid DomainEvent passed to EventDispatcher');
    }
    
    logger.debug(`Publishing event: ${domainEvent.eventName}`, { eventId: domainEvent.eventId }, 'EVENT_BUS');
    emitter.emit(domainEvent.eventName, domainEvent);
  }
}

module.exports = EventDispatcher;
