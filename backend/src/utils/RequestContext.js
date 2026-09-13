const { AsyncLocalStorage } = require('async_hooks');

const requestContext = new AsyncLocalStorage();

/**
 * Helper class to interact with the RequestContext AsyncLocalStorage.
 */
class RequestContext {
  static run(store, callback) {
    return requestContext.run(store, callback);
  }

  static getStore() {
    return requestContext.getStore() || {};
  }

  static get(key) {
    const store = this.getStore();
    return store[key];
  }

  static set(key, value) {
    const store = requestContext.getStore();
    if (store) {
      store[key] = value;
    }
  }
}

module.exports = RequestContext;
