'use strict'

const Panda = require('../../')
const ctx = Panda.ctx
const Hub = require('../../src/hub')
const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const cors = require('@koa/cors')
const serve = require('koa-static')
const render = require('../lib/koa-render')
const session = require('koa-session')
const path = require('path')
const mount = require('koa-mount')

const appCfg = Hub.getAppConfig('web')
const appBaseCfg = appCfg.app

module.exports = {
  name: 'web',

  settings: {
    port: process.env.API_PORT || appBaseCfg.port || 5000
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
    const nodeEnv = process.env.NODE_ENV || 'development'
    const logger = this.logger

    const projectCfg = Hub.getAppConfig('web')

    app.use(cors())
    app.use(bodyParser())

    app.use(this.establishSession(app))

    /*app.context.cmp = function(cmp, cfg={}) {
      console.log('app.context.cmp')
      app.broker.call('component.render', { cmp, cfg })
        .then(result => { console.log(result); return result })
    }*/
    app.context.cmp = async function(cmp, cfg={}) {
      return await app.broker.call('component.render', { cmp, cfg })
    }

    // simply for processing response time
    app.use(async (ctx, next) => {
      ctx.state = ctx.state || {}
      ctx.state._url = ctx.originalUrl
      ctx.state._env = ctx.app.env
      const start = Date.now()
      await next()
      const ms = Date.now() - start
      ctx.set('X-Response-Time', `${ms}ms`)
      logger.debug(`${ctx.method} ${ctx.url} (${ctx.status}) - ${ms}ms`)
    })

    if (appCfg.static) {
      this.logger.debug(`setting up static directories...`)
      appCfg.static.forEach((staticCfg) => {
        this.logger.debug(`  ${staticCfg.path}`)
        //app.use(serve(path.join(ctx.PROJECT_PATH, staticCfg.path)))
        if (staticCfg.mount) {
          app.use(mount(staticCfg.mount, serve(staticCfg.path)))
        } else {
          app.use(serve(staticCfg.path))
        }
      })
    }

    if (appCfg.routes) {
      this.logger.debug(`setting up routes...`)
      appCfg.routes.forEach((route) => {
        const files = route.files || []
        files.forEach((file) => {
          this.logger.debug(`  ${file}`)
          //const routeFile = require(path.join(ctx.PROJECT_PATH, file))
          const routeFile = require(file)
          app.use(routeFile.routes())
        })
      })
    }

    if (appCfg.views) {
      this.logger.debug(`setting up views...`)
      render (app, appCfg)
      appCfg.views.forEach((views) => {
        //const viewBasePath = path.join(ctx.PROJECT_PATH, views.path)
        const viewBasePath = path.join(views.path)
        /*render(app, {
          root: viewBasePath,
          includer: function (originalPath, parsedPath) {
            //const filename = path.join(localApp.viewsDir, originalPath + '.html')
            const filename = path.join(viewBasePath, originalPath + '.html')
            const fileExists = fs.fileExistsSync(filename)
            if (!fileExists) {
              logger.error(`Trying to access a view that does not exist: ${originalPath}`)
              const tpl = (nodeEnv === 'production') ? '-' : 'missing view: ' + originalPath
              return { template: tpl }
            }
          }
        })*/
      })
    }
  },

  started () {
    this.app.listen(Number(this.settings.port), err => {
      if (err) { return this.broker.fatal(err) }

      this.logger.info(`web server started on port ${this.settings.port}`)
    })
  },

  stopped () {
    if (this.app.listening) {
      this.app.close(err => {
        if (err) { return this.logger.error('web server close error!', err) }

        this.logger.info('web server stopped!')
      })
    }
  }
}