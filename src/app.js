
'use strict'

const PackageManager = require('./pkgmgr')
const path = require('path')
const logger = require('./log').getLogger('APP')
const Utility = require('./util')
const util = require('util')
const glob = util.promisify(require('glob'))
const Router = require('@koa/router')

const defaultOptions = {}

let instance = null

/**
 * PandaApp class
 *
 * @class PandaApp
 */
class PandaApp {
  /**
   * Creates an instance of PandaApp
   *
   * @param {Object} options - Initialization options
   */
  constructor (options) {
    try {
      this.options = Object.assign({}, defaultOptions, options)
      this.cache = new Map()
      this.logger = logger

      if (!instance) instance = this
      return instance
    } catch (err) {
      logger.error('Unable to create PandaApp', err)
    }
  }

  router () {
    return new Router()
  }

  /**
   * Getter/setter function for a specific app object
   *
   * @param {string} appId
   * @param {Object} opts
   * @returns
   */
  app (appId = '', opts) {
    let app

    if (!opts) {
      // getter
      app = this.cache.get(appId)
      if (app) return app
    }

    app = Object.assign({
      id: appId,
      cfg: {},
      port: null,
      publicDir: '',
      viewsDir: '',
      routes: []
    }, opts || {})

    this.cache.set(appId, app)
    return app
  }

  /**
   * Scan a directory for potential App directories
   *
   * @param {*} dir
   */
  async scanAppDir (dir, appId = 'web') {
    logger.debug(`App.scanAppDir(${dir}, ${appId})`)

    const pathList = {
      public: {
        fn: this.setPublicDir
      },
      routes: {
        fn: this.parseRoutesDir
      },
      services: {
        fn: this.parseServicesDir
      },
      views: {
        fn: this.parseViewsDir
      }
    }
    for (const [key, value] of Object.entries(pathList)) {
      const localPath = path.join(dir, key)
      logger.debug(`  Scanning ${key} directory: ${localPath}`)
      const dirExists = Utility.dirExists(localPath)
      if (dirExists) {
        logger.silly('    Directory does exist')
        if (value.fn && typeof value.fn === 'function') {
          // function exists as a function, call it
          await value.fn.call(this, appId, localPath)
        } else if (value.fn) {
          // function exists as a reference... add this later
        }
      } else {
        logger.silly('    Directory doesn\'t exist')
      }
    }
    return true
  }

  async setPublicDir (appId, dir) {
    logger.debug(`    App.setPublicDir(${appId}, ${dir})`)
    const publicDir = path.join(dir)
    this.app(appId).publicDir = publicDir

    return true
  }

  async parseRoutesDir (appId, dir) {
    logger.debug(`    App.parseRoutesDir(${appId}, ${dir})`)
    const files = await glob(path.join(dir, '/**/*.js'))
    const $this = this
    files.forEach(async function (file) {
      const relpath = file.replace(dir.split('\\').join('/'), '')
      const p = path.dirname(relpath)
      // app.use(p, require(file))
      await $this.registerRoute(appId, p, file)
    })
    return true
  }

  async registerRoute (appId, route, file) {
    logger.debug(`      App.registerRoute(${appId}, ${route}, ${file})`)
    this.app(appId).routes.push({
      route: route,
      file: file
    })
  }

  async parseServicesDir (appId, dir) {
    logger.debug(`    App.parseServicesDir(${appId}, ${dir})`)
    await PackageManager.scanServiceDir(dir)
    return true
  }

  async parseViewsDir (appId, dir) {
    logger.debug(`    App.parseViewsDir(${appId}, ${dir})`)
    this.app(appId).viewsDir = dir
    return true
  }
}

const Instance = new PandaApp()

module.exports = Instance
