'use strict'

const Hub = require('../../src/hub')
const Logger = require('../../src/logger')
const ApiService = require('moleculer-web')

const cfg = Hub.getAppConfig('api')
const app = cfg.app
if (!app.config) throw new Error('API requires a config to be set')

const logger = Logger.getLogger('APIApp')

let routes = app.config
if (!Array.isArray(routes)) routes = [routes]

module.exports = {
  mixins: [ApiService],

  settings: {
    port: process.env.API_PORT || app.port || 4000,
    routes
  },

  started () {
    logger.info(`api server started on port ${this.settings.port}`)
  },

  stopped () {
    logger.info('api server stopped')
  }
}
