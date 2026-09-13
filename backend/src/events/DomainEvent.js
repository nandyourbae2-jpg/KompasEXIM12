const crypto = require('crypto');
const RequestContext = require('../utils/RequestContext');

class DomainEvent {
  /**
   * @param {string} eventName - From EventRegistry
   * @param {string} aggregateId - The ID of the entity this event is about
   * @param {object} payload - The event data
   * @param {number} eventVersion - Version of the event payload schema (default: 1)
   */
  constructor(eventName, aggregateId, payload = {}, eventVersion = 1) {
    if (!eventName) throw new Error('DomainEvent requires an eventName');
    
    this.eventId = crypto.randomUUID();
    this.eventName = eventName;
    this.eventVersion = eventVersion;
    this.aggregateId = aggregateId;
    this.payload = payload;
    this.timestamp = new Date().toISOString();
    
    // Automatically capture the correlationId from the current HTTP request/async context
    this.correlationId = RequestContext.get('correlationId') || this.eventId;
  }
}

module.exports = DomainEvent;
