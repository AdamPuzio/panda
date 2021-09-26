'use strict'

// const logger = require('./log').getLogger('CONFIG')
const Logger = require('./log')
const Utility = require('./util')
const path = require('path')
const fs = require('fs')

const defaultOptions = {}
const defaultCfg = {
  APP_PATH: process.cwd(),
  PANDA_PATH: path.dirname(__dirname),
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug'
}

let instance = null

// getter/setter handler so no exception is ever thrown
const handler = {
  get: function (target, name) {
    if (typeof name === 'symbol') { return null }
    if (!(name in target)) {
      target[name] = new Proxy({}, {
        get: function (target, name) {
          return undefined
        }
      })
    }
    return target[name]
  },
  set (target, key, value) {
    return true
  }
}

/**
 * Config class
 *
 * @class Config
 */
class Config {
  /**
   * Creates an instance of Config
   *
   * @param {Object} options - Initialization options
   */
  constructor (options) {
    try {
      this.logger = Logger.getLogger('CONFIG', { level: 'debug' })
      this.options = Object.assign({}, defaultOptions, options)
      this.cfgObj = Object.assign({}, defaultCfg)
      this.cfg = new Proxy(this.cfgObj, handler)

      if (!instance) instance = this
      return instance
    } catch (err) {
      console.log('Unable to create Config', err)
    }
  }

  async load (cfgFile, cfg = {}) {
    try {
      this.logger.info('Loading Configuration')
      const cfgAbsFile = path.join(this.cfgObj.APP_PATH, cfgFile)
      if (fs.existsSync(cfgAbsFile)) {
        this.logger.info(`Loading config file at ${cfgFile}`)
        this.cfgObj = Utility.loadJsonFile(cfgAbsFile)
      } else {
        this.logger.debug(`No config file exists at ${cfgAbsFile}`)
      }
    } catch (e) {
      this.logger.info(`Could not load config file ${cfgFile}`)
    }

    this.cfgObj = Object.assign(this.cfgObj, cfg)

    return this.cfg
  }

  async readCfg (cfgfile) {

  }
}

const PandaConfig = new Config()

module.exports = PandaConfig
