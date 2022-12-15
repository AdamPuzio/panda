'use strict'

const Logger = require('../../src/logger')
const Hub = require('../../src/hub')
const Utility = require('../../src/utility')
const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const cors = require('@koa/cors')
const serve = require('koa-static')
const session = require('koa-session')
const mount = require('koa-mount')
const path = require('path')
const render = require('../lib/koa-render')

const appCfg = Hub.getAppConfig('web')
const appBaseCfg = appCfg.app

const logger = Logger.getLogger('WebApp')

const options = Utility.parseOptions([
  { name: 'port', alias: 'p' }
])

module.exports = {
  name: 'web',

  settings: {
    port: options.port || process.env.PORT || appBaseCfg.port || 5000
  },

  methods: {

    establishSession: function (app) {
      app.keys = ['panda-key']
      const sessionCfg = {
        key: 'panda.session'
      }
      return session(sessionCfg, app)
    }
  },

  async created () {
    const app = this.app = new Koa()
    app.broker = app.context.broker = this.broker
    // const nodeEnv = process.env.NODE_ENV || 'development'

    app.use(cors())
    app.use(bodyParser())

    app.use(this.establishSession(app))

    // register the component function
    app.context.cmp = async function (cmp, cfg = {}) {
      return await app.broker.call('component.render', { cmp, cfg })
    }

    // simply for processing response time and logging requests
    app.use(async (ctx, next) => {
      ctx.state = ctx.state || {}
      ctx.state._url = ctx.originalUrl
      ctx.state._env = ctx.app.env
      const start = Date.now()

      if (!ctx.session.session_id) ctx.session.session_id = Utility.uuid()

      await next()

      const ms = Date.now() - start
      ctx.set('X-Response-Time', `${ms}ms`)
      logger.http(`${ctx.method} ${ctx.url} (${ctx.status}) - ${ms}ms [session:${ctx.session.session_id}]`)
    })

    // static directories
    if (appCfg.statics) {
      logger.debug('setting up static directories...')
      appCfg.statics.forEach((staticCfg) => {
        logger.debug(`  ${staticCfg.path}`)
        if (staticCfg.mount) {
          app.use(mount(staticCfg.mount, serve(staticCfg.live)))
        } else {
          app.use(serve(staticCfg.live))
        }
      })
    }

    // routes
    if (appCfg.routes) {
      logger.debug('setting up routes...')

      appCfg.routes.forEach((route) => {
          logger.debug(`  ${route.live}`)
          let relPath = path.dirname(route.relpath)
          const routeFile = require(route.live)
          if (relPath !== '/' && relPath !== '.') {
            // in case our path doesn't start with a /
            if (!relPath.startsWith('/')) relPath = '/' + relPath
            app.use(mount(relPath, routeFile.routes()))
          } else {
            app.use(routeFile.routes())
          }
      })
    }

    // views
    if (appCfg.views) {
      logger.debug(`setting up views...`)
      render (app, appCfg)
    }
  },

  started () {
    this.app.listen(Number(this.settings.port), err => {
      if (err) { return this.broker.fatal(err) }

      logger.info(`web server started on port ${this.settings.port}`)
    })
  },

  stopped () {
    if (this.app.listening) {
      this.app.close(err => {
        if (err) { return this.logger.error('web server close error!', err) }

        logger.info('web server stopped')
      })
    }
  }
}
