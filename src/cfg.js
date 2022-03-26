'use strict'

// const logger = require('./log').getLogger('CONFIG')
const Logger = require('./log')
const Utility = require('./util')
const path = require('path')
const fs = require('fs')
const CacheBase = require('cache-base')

const defaultOptions = {}
const defaultCfg = {
  APP_PATH: process.cwd(),
  PANDA_PATH: path.dirname(__dirname),
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug'
}

let instance = null

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
      this.cfg = new CacheBase(this.cfgObj)
      this._fileConfigs = {}

      if (!instance) instance = this
      return instance
    } catch (err) {
      console.log('Unable to create Config', err)
    }
  }

  /**
   * Load a configuration file
   * 
   * @param {string} cfgFile - the path to load the config file from, relative to APP_PATH
   * @returns 
   */
  async load (cfgFile) {
    this.logger.debug(`Loading Configuration`)
    // get absolute path and check it exists
    const cfgAbsFile = path.join(this.cfgObj.APP_PATH, cfgFile)
    if (!fs.existsSync(cfgAbsFile)) {
      this.logger.debug(`  config file (${cfgAbsFile}) doesn't exist`)
      return this.cfg
    }

    // config file exists, load it
    this.logger.info(`Loading config file at ${cfgFile}`)
    let cfgExt = cfgFile.split('.').pop()
    let cfgObj
    if(cfgExt == 'js') { // .js file, require it
      cfgObj = require(cfgAbsFile)
    } else if (cfgExt == 'json') { // json file, import it
      cfgObj = await Utility.loadJsonFile(cfgAbsFile)
    } else { // unknown type, throw error
      throw new Error(`Inproper extension for config file ${cfgFile}`)
    }
    // load up the local file cache
    this.fileConfigs[cfgFile] = {
      relPath: cfgFile,
      absPath: cfgAbsFile,
      fileExt: cfgExt,
      content: cfgObj
    }
    // cfgObj becomes the default config + loaded config
    cfgObj = this.cfgObj = Object.assign(this.cfgObj, cfgObj)
    // update the main cfg object
    this.cfg = new CacheBase(cfgObj)

    return this.cfg
  }

  /**
   * Get the core configuration
   * 
   * @returns {CacheBase}
   */
  getConfig () {
    return this.cfg
  }
}

const PandaConfig = new Config()

module.exports = PandaConfig
