const EventDispatcher = require('../../events/EventDispatcher');
const EventRegistry = require('../../events/EventRegistry');
const logger = require('../../utils/logger');
const RequestContext = require('../../utils/RequestContext');

class TestEventSubscriber {
  /**
   * Used for testing only. We expose an array to capture executions 
   * so the Jest integration test can verify if this fired.
   */
  static executions = [];

  static init() {
    EventDispatcher.subscribe(EventRegistry.TEST_EVENT_FIRED, async (domainEvent) => {
      // 1. Verify Trace Context propagates
      const activeCorrelationId = RequestContext.get('correlationId');
      
      // 2. Perform some fake work
      logger.info('Performing side-effect inside subscriber', { payload: domainEvent.payload }, 'TEST_SUBSCRIBER');
      
      if (domainEvent.payload.fail) {
        throw new Error('Subscriber intentionally failed');
      }

      this.executions.push({
        eventId: domainEvent.eventId,
        correlationId: activeCorrelationId,
        payload: domainEvent.payload
      });
    });
  }
}

module.exports = TestEventSubscriber;
