'use strict'

const PackageManager = require('./pkgmgr')
const Utility = require('./util')
const { ServiceBroker } = require('moleculer')
const logger = require('./log').getLogger('CORE')
const path = require('path')

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
      this.options = Object.assign({}, defaultOptions, options)
      this.broker = null
      this._global = require('is-installed-globally')

      if (!instance) instance = this
      return instance
    } catch (err) {
      console.log('Unable to create Core', err)
    }
  }

  getVersion () {
    return require('../package.json').version
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
      logLevel: process.env.LOG_LEVEL || opts.logLevel || 'debug'
    })

    svcList.forEach(function (svcFile) {
      broker.loadService(svcFile)
    })

    broker.start()
    this.broker = broker
    if (opts.repl && opts.repl === true) broker.repl()
    return broker
  }

  /**
   * Get the service broker
   */
  getBroker () {
    return this.broker
  }

  /**
   * Determine the base of the current working Project directory
   * 
   * @param {string} cwd 
   * @param {boolean} checkApp 
   */
  determineProjectDirectory (cwd=null) {
    if (!cwd) cwd = process.cwd()
    let cwdx = cwd
    let appDir = null
  
    while (!appDir) {
      const projectJsonExists = Utility.fileExistsSync(path.join(cwdx, 'project.json'))
      // if the app directory exists (or checkApp is false) and package.json exists
      if (projectJsonExists) appDir = cwdx
      if (cwdx === path.dirname(cwdx)) {
        //throw new Error(`${cwd} has no relative path that was deemed as a Project directory`)
        return false
      }
      cwdx = path.dirname(cwdx)
    }
  
    return appDir
  }

  /*determineProjectDirectory (cwd=null, checkApp=true) {
    if (!cwd) cwd = process.cwd()
    let cwdx = cwd
    let appDir = null
  
    while (!appDir) {
      const appDirExists = Utility.fileExistsSync(path.join(cwdx, 'app'))
      const packageJsonExists = Utility.fileExistsSync(path.join(cwdx, 'package.json'))
      // if the app directory exists (or checkApp is false) and package.json exists
      if ((appDirExists && packageJsonExists) || (checkApp === false && packageJsonExists)) appDir = cwdx
      if (cwdx === path.dirname(cwdx)) {
        //throw new Error(`${cwd} has no relative path that was deemed as a Project directory`)
        return false
      }
      cwdx = path.dirname(cwdx)
    }
  
    return appDir
  }*/
}

Core.VERSION = pandaVersion
Core.prototype.VERSION = Core.VERSION

const PandaCore = new Core()

module.exports = PandaCore
