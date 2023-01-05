'use strict'

const Context = require('./context')
const Logger = require('./logger')
const Utility = require('./utility')
const Project = require('./entity/project')
const PandaSingleton = require('./class/singleton')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs-extra')
const _ = require('lodash')
const glob = require('util').promisify(require('glob'))
const CacheBase = require('cache-base')
const { ServiceBroker } = require('moleculer')
const Koa = require('koa')
const serve = require('koa-static')

const ctx = Context.ctx

/**
 * PandaHub
 */
class PandaHub extends PandaSingleton {
  _env = {}

  constructor () {
    if (PandaHub._instance) return PandaHub._instance
    super()
    PandaHub._instance = this

    this._cache = new CacheBase()

    this.loadEnvConfig()
    this.logger.silly('initialize Hub')
  }

  /**
   * Load a .env file
   * 
   * @returns 
   */
  loadEnvConfig () {
    const envFile = path.join(process.cwd(), '.env')
    if (!fs.existsSync(envFile)) return
    const env = dotenv.config()
    this._env = env.parsed
  }

  /**
   * Creates or retrieves the service broker
   * 
   * @returns {Broker} the moleculer broker
   */
  async getBroker () {
    if (this._broker) return this._broker
    const logCfg = Logger.getLogger().getConfig()
    if (logCfg.level !== 'debug') logCfg.level = 'http'
    this._broker = new ServiceBroker({
      logger: {
        type: 'Winston',
        options: {
          level: logCfg.level,
          winston: logCfg
        }
      }
    })
    return this._broker
  }

  /**
   * Loads a project configuration object or file
   * 
   * @param {Object|String} projectCfg 
   */
  async load (projectCfg) {
    this.logger.silly('Hub.load()')
    if (typeof projectCfg === 'string') projectCfg = require(Utility.tpl(projectCfg, Context.ctx))
    this.Project = new Project(projectCfg)
    await this.Project.build()
    return this.Project
  }

  /**
   * Add an entity to the configuration
   * 
   * @param {String} entityType entity type (app, service, package, component, etc.)
   * @param {String} entityObj entity configuration object
   * @returns 
   */
  async add (entityType, entityObj) {
    this.logger.silly('Hub.add()')
    return await this.Project.add(entityType, entityObj)
  }

  /**
   * Get the project configuration info
   * 
   * @returns {Object} project configuration object
   */
  projectInfo () {
    this.logger.silly('Hub.projectInfo()')
    return this.Project.info()
  }

  /**
   * Run a project
   * 
   * @param {*} app 
   * @param {Object} projectInfo 
   * @param {Object} opts 
   */
  async run (app = '*', projectInfo, opts = {}) {
    this.logger.silly('Hub.run()')
    opts = { ...{}, ...opts }

    if (!projectInfo) projectInfo = this.Project.info()
    this._projectInfo = projectInfo

    this.logger.verbose('Loading Service Broker...')
    const broker = await this.getBroker()

    const svcList = projectInfo.services || []
    this.logger.verbose('Loading Services...')
    svcList.forEach((svcCfg) => {
      const svcPath = path.join(svcCfg.live)
      let svc = require(svcPath)
      if (svc.exportService) svc = svc.exportService()
      this.logger.debug(`  ${svc.name} service loaded`)
      // broker.loadService(svc) if passing file
      broker.createService(svc)
    })

    const appList = projectInfo.apps || []
    this.logger.verbose('Loading Apps...')
    appList.forEach((appCfg) => {
      this.logger.debug(`  ${appCfg.name} app loaded`)
      const appPath = path.join(appCfg.live)
      if (app === '*' || app === appCfg.name || (Array.isArray(app) && app.includes(appCfg.name))) broker.loadService(appPath)
    })

    broker.start()
  }

  /**
   * Serve static content from a directory
   * 
   * @param {String} dir 
   */
  serve (dir) {
    const port = process.env.PORT || 5100
    const app = new Koa()
    if (!dir) dir = Context.ctx.cwd
    this.verbose(`serving from: ${dir}`)
    app.use(serve(dir))

    app.use(async (ctx, next) => {
      const start = Date.now()

      await next()

      const ms = Date.now() - start
      ctx.set('X-Response-Time', `${ms}ms`)
      this.logger.http(`${ctx.method} ${ctx.url} (${ctx.status}) - ${ms}ms`)
    })

    app.listen(Number(port), err => {
      if (err) return this.logger.fatal(err)

      this.verbose(`static server started on port ${port}`)
    })
  }

  /**
   * Retrieve the configuration for a specific application
   * 
   * @param {String} app the app to retrieve a config for
   * @returns {Object} a list of apps, static directories, routes and views
   */
  getAppConfig (app) {
    const pinfo = this._projectInfo || this.Project.info()
    if (!pinfo) throw new Error('No Project loaded')
    const appInfo = pinfo.apps.find(el => el.name === app)
    if (!appInfo) throw new Error(`No app config available for ${app}`)
    function fn (entity) {
      // if provided a list, check for a match
      if (Array.isArray(entity.app)) {
        for (let i=0; i<entity.app.length; i++) {
          if (entity.app[i] === app) return true
        }
      }
      if (entity.app === app) return true
      if (entity.app === '*') return true
      if (app === 'web' && !entity.app) return true
      return false
    }
    
    return {
      app: pinfo.apps.find(el => el.name === app),
      statics: pinfo.statics.filter(fn),
      routes: pinfo.routes.filter(fn),
      views: pinfo.views.filter(fn)
    }
  }
}

module.exports = new PandaHub()