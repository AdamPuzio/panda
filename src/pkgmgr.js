
'use strict'

const path = require('path')
const Glob = require('glob')
const Config = require('./cfg').cfg
const Utility = require('./util')
const logger = require('./log').getLogger('PKGMGR')

const defaultOptions = {
  manifestFilename: 'pkg_manifest.json'
}

let instance = null

/**
 * PackageManager class
 *
 * @class PackageManager
 */
class PackageManager {
  /**
   * Creates an instance of PackageManager
   *
   * @param {Object} options - Initialization options
   */
  constructor (options) {
    try {
      this.options = Object.assign({}, defaultOptions, options)
      this.Packages = {}
      this.Services = {}

      //this.scanPandaServices()
      
      if(!instance) instance = this
      return instance
    } catch (err) {
      console.log('Unable to create PackageManager', err)
    }
  }

  /**
   * Scan the Panda services directory for all Services
   */
  async scanPandaServiceDir () {
    logger.debug('PackageManager.scanPandaServiceDir()')
    let svcDir = path.join(Config.PANDA_PATH, 'base', 'services')
    return this.scanServiceDir(svcDir)
  }

  /**
   * Scan a directory for Services
   */
  async scanServiceDir (svcDir) {
    logger.debug('PackageManager.scanServiceDir()')
    let svcList = this.Services
    logger.debug(`Scanning directory for Services: ${svcDir}`)
    let files = Glob.sync(path.join(svcDir, '/**/*.service.js'))
    
    files.forEach(function (val) {
      logger.debug(`  Loading Service at ${val}`)
      let svc
      svc = require(val)
      let svcName = svc.name
      let svcVersion = svc.version || 1
      if(!svcList[svcName]) svcList[svcName] = {
        _default_: svcVersion,
        _files_: []
      }
      svcList[svcName][svcVersion] = {
        filename: val,
        //info: svc
      }
      svcList[svcName]._files_.push(val)
    })
  }

  /**
   * Scan a directory for potential Package manifest files
   * 
   * @param {*} dir 
   */
  async scanPackageDir (dir) {
    logger.debug('PackageManager.scanPackageDir()')
    let pkgDir = path.join(Config.APP_PATH, dir)
    logger.debug(`Scanning Package directory: ${pkgDir}`)
    let files = Glob.sync(path.join(dir, '/**/*/' + this.options.manifestFilename))
    logger.debug(files)
    return true
  }

  /**
   * Parse and validate a list of Services
   * 
   * @param {*} svcs 
   */
  async parseServiceList(svcs) {
    logger.debug('PackageManager.parseServiceList()')
    let svcList = []

    // check if a string list needs to be split
    if(typeof svcs === 'string' && svcs != '*') {
      svcs = svcs.split(',')
    }

    // let's just confirm that the value is now * or an Array
    if(svcs != '*' && !Array.isArray(svcs))
      throw new Error(`List of services to run isn't valid`)
    
    if(svcs === '*') {
      // parse all Services from list
      for (const [key, value] of Object.entries(this.Services))
        svcList = svcList.concat(value._files_)
    } else {
      // parse the list
      svcs.forEach(function (v) {
        let svcArray = v.split('@')
        let svcName = svcArray[0]
        let svcVersion = svcArray[1]
        if(this.Services[svcName]) {
          if(!svcVersion) svcVersion = this.Services[svcName]._default_
          let svcObj = this.Services[svcName][svcVersion]
          let svcFile = svcObj.filename
          svcList.push(svcFile)
        }
      })
    }

    return svcList
  }

  async scanApp (dir) {
    return true
  }
  
}

const Instance = new PackageManager()

module.exports = Instance