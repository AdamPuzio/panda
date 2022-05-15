'use strict'

const EventEmitter = require('events')

class PandaEventEmitter extends EventEmitter {
  constructor(...args) {
    super(...args)

    // automatically apply logger
    if (this.constructor.name !== 'PandaHub') {
      const Hub = require('../hub')
      this.logger = Hub.getLogger(this.constructor.name)
    }
  }

  log (...args) { this.logger.log(...args) }
  error (...args) { this.logger.error(...args) }
  warn (...args) { this.logger.warn(...args) }
  info (...args) { return this.logger.info(...args) }
  debug (...args) { this.logger.debug(...args) }
  trace (...args) { if (process.env.TRACE_MODE) console.log(...args)}
}

module.exports = PandaEventEmitter