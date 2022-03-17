'use strict'

const PackageManager = require('./pkgmgr')
const { ServiceBroker } = require('moleculer')
const logger = require('./log').getLogger('CORE')

const defaultOptions = {}

let instance = null
const pandaVersion = require('../package.json').version

/**
 * Core class
 *
 * @class Core
 */
class Core {
  /**
   * Creates an instance of Core
   *
   * @param {Object} options - Initialization options
   */
  constructor (options) {
    try {
      logger.info(`Panda v${pandaVersion} is starting...`)
      this.options = Object.assign({}, defaultOptions, options)

      if (!instance) instance = this
      return instance
    } catch (err) {
      console.log('Unable to create Core', err)
    }
  }

  /**
   * Run a service broker
   *
   * @param {String} svcs - List of services to run in the broker
   */
  async runBroker (svcs, opts = {}) {
    logger.debug('Core.runBroker()')
    const svcList = await PackageManager.parseServiceList(svcs, opts.ignore)

    // Create a ServiceBroker
    const broker = new ServiceBroker({
      logLevel: process.env.LOG_LEVEL || 'debug',
      errorHandler (err, info) {
        logger.error('BROKER ERROR HANDLER')
        logger.error(err)
      }
    })

    svcList.forEach(function (svcFile) {
      broker.loadService(svcFile)
    })

    broker.start()
    if (opts.repl && opts.repl === true) broker.repl()
    return broker
  }
}

Core.VERSION = pandaVersion
Core.prototype.VERSION = Core.VERSION

const PandaCore = new Core()

module.exports = PandaCore
