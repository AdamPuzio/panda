'use strict'

const ExtendableError = require('es6-error')
const ERR_NO_TOKEN = 'NO_TOKEN'
const ERR_INVALID_TOKEN = 'INVALID_TOKEN'

/**
 * Base Panda Error class
 *
 * @class PandaError
 * @extends {ExtendableError}
 */
class PandaError extends ExtendableError {
  /**
   * Creates an instance of PandaError
   *
   * @param {String?} message
   * @param {Number?} code
   * @param {String?} type
   * @param {any} data
   *
   * @memberof PandaError
   */
  constructor (message, code, type, data) {
    super(message)
    this.code = code || 500
    this.type = type
    this.data = data
    this.retryable = false
  }
}

/**
 * Panda Error class for client errors
 *
 * @class PandaClientError
 * @extends {PandaError}
 */
class PandaClientError extends PandaError {
  /**
   * Creates an instance of PandaClientError.
   *
   * @param {String?} message
   * @param {Number?} code
   * @param {String?} type
   * @param {any} data
   *
   * @memberof PandaClientError
   */
  constructor (message, code, type, data) {
    super(message, code || 400, type, data)
  }
}

/**
 * 'Page not found' Error message
 *
 * @class PageNotFoundError
 * @extends {PandaError}
 */
class PageNotFoundError extends PandaError {
  /**
   * Creates an instance of PageNotFoundError
   *
   * @param {Object} data
   *
   * @memberof PageNotFoundError
   */
  constructor (data = {}) {
    const msg = 'Page not found'

    super(msg, 404, 'PAGE_NOT_FOUND', data)
  }
}

/**
 * Validation error
 *
 * @class ValidationError
 * @extends {PandaClientError}
 */
class ValidationError extends PandaClientError {
  /**
   * Creates an instance of ValidationError
   *
   * @param {String} message
   * @param {String} type
   * @param {any} data
   *
   * @memberof ValidationError
   */
  constructor (message, type, data) {
    super(message, 422, type || 'VALIDATION_ERROR', data)
  }
}

/**
 * Unauthorized error
 *
 * @class UnauthorizedError
 * @extends {PandaClientError}
 */
class UnauthorizedError extends PandaClientError {
  /**
   * Creates an instance of UnauthorizedError
   *
   * @param {String} message
   * @param {String} type
   * @param {any} data
   *
   * @memberof UnauthorizedError
   */
  constructor (message, type, data) {
    super(message || 'Unauthorized', 401, type || 'UNAUTHORIZED_ERROR', data)
  }
}

/**
 * Forbidden error
 *
 * @class ForbiddenError
 * @extends {PandaClientError}
 */
class ForbiddenError extends PandaClientError {
  /**
   * Creates an instance of ForbiddenError
   *
   * @param {String} message
   * @param {String} type
   * @param {any} data
   *
   * @memberof ForbiddenError
   */
  constructor (message, type, data) {
    super(message, 403, type || 'FORBIDDEN_ERROR', data)
  }
}

/**
 * Recreate an error from a transferred payload `err`
 *
 * @param {Error} err
 * @returns {PandaError}
 */
function recreateError (err) {
  const Class = module.exports[err.name]
  if (Class) {
    switch (err.name) {
      case 'PandaError': return new Class(err.message, err.code, err.type, err.data)
      case 'PandaClientError': return new Class(err.message, err.code, err.type, err.data)
      case 'PageNotFoundError': return new Class(err.message, err.code, err.type, err.data)
      case 'ValidationError': return new Class(err.message, err.type, err.data)
      case 'UnauthorizedError': return new Class(err.message, err.type, err.data)
      case 'ForbiddenError': return new Class(err.message, err.type, err.data)
    }
  }
}

module.exports = {
  PandaError,
  PandaClientError,
  PageNotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  recreateError,
  ERR_NO_TOKEN,
  ERR_INVALID_TOKEN
}
