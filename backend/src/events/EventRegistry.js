/**
 * Centralized Event Registry
 * Avoids string literals and standardizes domain event names.
 */
const EventRegistry = {
  // Dummy event for testing the architecture
  TEST_EVENT_FIRED: 'TEST_EVENT_FIRED',
  
  // Future events (Examples)
  // PAYMENT_CREATED: 'PAYMENT_CREATED',
  // JOB_ORDER_COMPLETED: 'JOB_ORDER_COMPLETED',
};

module.exports = EventRegistry;
