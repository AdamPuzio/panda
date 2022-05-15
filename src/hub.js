'use strict'

const Panda = require('../')
const Utility = require('./utility')
const PandaLogger = require('./logger')
const PandaEventEmitter = require('./class/event-emitter')
const CacheBase = require('cache-base')
const path = require('path')
const _ = require('lodash')

/**
 * PandaHub
 */
class PandaHub extends PandaEventEmitter {
  /**
   * PandaHub constructor
   * 
   * @returns 
   */
  constructor() {
    super()
    if (PandaHub._instance) return PandaHub._instance
    PandaHub._instance = this

    this._configs = []
    this._configCache = new Map()
    this._loggerCache = new Map()
    this.configure()
    this.logger = this.getLogger(this.constructor.name)
    this.debug(`Panda.Hub initialized`)
  }

  /**
   * Gets (or creates if it doesn't exist) a logger for a namespace
   * 
   * @param {String} ns 
   * @param {Object} opts 
   * @returns 
   */
  getLogger (ns='app', opts={}) {
    if (typeof ns === 'object') { opts = ns; ns = 'app' }
    this.trace(`Logger.getLogger() for ${ns}`)
    if (Object.keys(opts).length === 0 && this._loggerCache.has(ns)) return this._loggerCache.get(ns)
    return this.setLogger(ns, opts)
  }

  /**
   * Sets the logger for a namespace
   * 
   * @param {String} ns 
   * @param {Object} opts 
   * @returns 
   */
  setLogger (ns, opts={}) {
    let pvals = {logLevel: 'level', logLevels: 'levels', logFormat: 'format', logTransports: 'transports', logSilent: 'silent'}
    
    const loggerOpts = Utility.pick(Object.assign({}, this.getConfig().get(), opts, this.parseEnv()), pvals)

    const logger = new PandaLogger(ns, loggerOpts, this)
    this.on('config.update', (opts, cfg) => {
      const fns = { level: 'logLevel' }
      let optObj = {}
      Object.keys(fns).forEach((k) => {
        const v = fns[k]
        if (opts && opts[v]) optObj[k] = opts[v]
      })
      logger.configure(optObj)
    })
    this._loggerCache.set(ns, logger)
    return logger
  }

  /**
   * Gets (or creates if it doesn't exist) a configuration
   * 
   * @param {String} ns 
   * @returns 
   */
  getConfig (ns='global') {
    this.trace(`Config.getConfig() for ${ns}`)
    if (this._configCache.has(ns)) return this._configCache.get(ns)

    const cache = new CacheBase()
    this._configCache.set(ns, cache)
    return cache
  }

  /**
   * Sets the configuration
   * 
   * @param  {...any} args 
   * @returns 
   */
  configure (...args) {
    let [ns, opts] = args
    if (!opts) { opts = ns; ns = 'global' }
    this.trace(`Config.configure() for ${ns}`)
    const cfg = this.getConfig(ns)

    if (!opts) {
      // default configuration
      this.loadProjectJson()
    } else if (typeof opts === 'string') {
      // load a configuration file
      const filePath = path.join(process.cwd(), opts)
      const fileContents = require(filePath)
      cfg.set(fileContents)
      this._configs.push({ ns, type: 'file', path: filePath, value: fileContents })
    } else if (Array.isArray(opts)) {
      // load a series of configurations
      throw new Error(`Multiple configs is not yet implemented`)
    } else if (typeof opts === 'object') {
      // load a configuration object
      cfg.set(opts)
      this._configs.push({ ns, type: 'object', value: opts })
    } else {
      // fail
      throw new Error(`Config.configure() being passed an unaccepted type`)
    }
    if (ns === 'global') this.emit('config.update', opts, cfg)
    else this.emit('config.ns-update', ns, opts, cfg)
    return cfg
  }

  /**
   * Loads project.json into the global config
   * 
   * @param {String} cwd 
   * @returns 
   */
  async loadProjectJson (cwd) {
    this.trace(`Config.loadProjectJson()`)
    if (!cwd) cwd = process.cwd()
    const filePath = path.join(cwd, 'project.json')
    if (!Utility.pathExistsSync(filePath)) return false
    const projectJson = require(filePath)
    this.getConfig().set(projectJson)
    this._configs.push({ ns: 'project', type: 'project-json', value: projectJson })
    return true
  }

  /**
   * Parses environmental variables
   * 
   * Environmental variables parsed:
   *   - LOG_LEVEL
   *   - LOG_FORMAT
   * 
   * @returns 
   */
  parseEnv () {
    const envs = ['LOG_LEVEL', 'LOG_FORMAT']
    const vars = {}
    envs.forEach((env) => { 
      const cam = _.camelCase(env.toLowerCase())
      if (process.env[env]) vars[cam] = process.env[env]
    })
    return vars
  }
}

module.exports = new PandaHub()