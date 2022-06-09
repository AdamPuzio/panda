'use strict'

const Project = require('./project')
const PandaCore = require('panda-core')
const PandaSingleton = PandaCore.class.Singleton
const { ServiceBroker } = require('moleculer')
const path = require('path')

class PandaHub extends PandaSingleton {
  constructor () {
    if (PandaHub._instance) return PandaHub._instance
    super()
    PandaHub._instance = this

    this.debug('init PandaHub')
  }

  async getBroker () {
    if (this._broker) return this._broker
    const logCfg = PandaCore.getLogger().getConfig()
    if (logCfg.level !== 'debug') logCfg.level = 'http'
    this._broker = new ServiceBroker({
      logger: {
        type: 'Winston',
        options: {
          level: logCfg.level,
          winston: logCfg
        }
      }
      // logLevel: process.env.LOG_LEVEL || opts.logLevel || 'debug'
    })
    return this._broker
  }

  async start (app = '*', opts = {}) {
    opts = { ...{}, ...opts }

    const projectInfo = this._projectInfo = await Project.live()

    this.logger.info('Loading Service Broker...')
    const broker = await this.getBroker()

    const svcList = projectInfo.services || []
    this.logger.info('Loading Services...')
    svcList.forEach((svcCfg) => {
      this.logger.info(`  ${svcCfg.name}`)
      const svc = path.join(svcCfg.path)
      broker.loadService(svc)
    })

    const appList = projectInfo.apps || []
    this.logger.info('Loading Apps...')
    appList.forEach((appCfg) => {
      this.logger.info(`  ${appCfg.name}`)
      const appPath = path.join(appCfg.path)
      if (app === '*' || app === appCfg.name) broker.loadService(appPath)
      this.logger.info(`${appCfg.name} app running on port ${appCfg.port}`)
    })

    broker.start()
  }

  getAppConfig (app) {
    const pinfo = this._projectInfo
    const appInfo = pinfo.apps.find(el => el.name === app)
    if (!appInfo) throw new Error(`No app config available for ${app}`)
    return {
      app: appInfo,
      static: pinfo.static,
      routes: pinfo.routes,
      views: pinfo.views
    }
  }
}

module.exports = new PandaHub()
