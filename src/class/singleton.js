'use strict'

const EventEmitter = require('events')
const Logger = require('../logger')

/**
 * PandaSingleton
 */
class PandaSingleton extends EventEmitter {
  /**
   * PandaSingleton constructor
   * 
   * @param  {...any} args 
   * @returns 
   */
  constructor (...args) {
    super(...args)

    this.setLogger()

    if ('instance' in this.constructor) { return this.constructor.instance }

    this.constructor.instance = this
  }

  /**
   * Apply a logger to the current class
   */
  setLogger () {
    this.logger = Logger.getLogger(this.constructor.name.replace('Panda', ''))

    // create convenience methods for each log level
    Object.keys(this.logger._logger.levels).forEach((level) => { this[level] = (...args) => { return this.logger[level](...args) } })
  }
}

module.exports = PandaSingleton
