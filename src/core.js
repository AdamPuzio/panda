'use strict'

const PackageManager = require('./pkgmgr')
const { ServiceBroker } = require('moleculer')
const logger = require('./log').getLogger('CORE')

const defaultOptions = {}

let instance = null
let pandaVersion = require('../package.json').version

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
      
      if(!instance) instance = this
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
  async runBroker (svcs) {
    logger.debug(`Core.runBroker()`)
    let svcList = await PackageManager.parseServiceList(svcs)
    
    // Create a ServiceBroker
    const broker = new ServiceBroker({
      errorHandler(err, info) {
        logger.error(`BROKER ERROR HANDLER`)
        logger.error(err)
      }
    })

    svcList.forEach(function(svcFile) {
      broker.loadService(svcFile)
    })

    broker.start()
  }
  
}

Core.VERSION = pandaVersion
Core.prototype.VERSION = Core.VERSION

const PandaCore = new Core()

module.exports = PandaCore