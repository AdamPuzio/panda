'use strict'

const Panda = require('../../')
const { PandaError, PandaClientError, PageNotFoundError, ValidationError, UnauthorizedError, ForbiddenError } = Panda.Errors
const logger = Panda.Logger.getLogger('WWW')
const ApiGateway = require('moleculer-web')
const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const servePublic = require('koa-static')
const cors = require('@koa/cors')
const session = require('koa-session')
const render = require('koa-ejs')

const localApp = Panda.App.app('web')

module.exports = {
  name: 'web',
  mixins: [ApiGateway],

  settings: {
    port: process.env.PORT || localApp.port || 5000,
    tenancyMode: 'single'
  },

  dependencies: [
    // 'package'
  ],

  methods: {
    handleErr: function (err, req, res, next) {
      switch (true) {
        case err instanceof PageNotFoundError:
        case err instanceof ValidationError:
          break
        case err instanceof UnauthorizedError:
          return res.redirect('/login')
          break
        case err instanceof ForbiddenError:
          return res.status(err.code).send('You do not have the proper permissions')
          break
        case err instanceof PandaError:
        case err instanceof PandaClientError:
          break
      }
      logger.error('UNKNOWN ERROR [' + typeof err + ']')
      logger.error(err)
      const code = err.code || 500
      const message = err.message || 'ERROR'
      res.status(code).send(message)
    },

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
    const broker = app.broker = this.broker

    app.use(cors())
    app.use(bodyParser())

    /* app.on('error', err => {
      logger.error('server error', err)
    }) */

    if (localApp.viewsDir) {
      render(app, {
        root: localApp.viewsDir,
        // layout: 'template',
        layout: false,
        viewExt: 'html',
        cache: false,
        debug: false
      })
    }

    app.use(this.establishSession(app))

    // simply for processing response time
    app.use(async (ctx, next) => {
      const start = Date.now()
      await next()
      const ms = Date.now() - start
      ctx.set('X-Response-Time', `${ms}ms`)
      logger.verbose(`${ctx.method} ${ctx.url} (${ctx.status}) - ${ms}ms`)
    })

    // render generic 404 if nothing found
    app.use(async (ctx, next) => {
      await next()
      if (ctx.status === 404) {
        ctx.status = 404
        ctx.body = '404 Page Not Found'
      }
    })

    // todo: maintenance mode

    // static directories
    const staticDir = Panda.App.app('web').publicDir
    app.use(servePublic(staticDir))

    // local routes
    const localRoutes = Panda.App.app('web').routes
    localRoutes.forEach(function (item, index) {
      const r = require(item.file)
      r.prefix(item.route)
      app.use(r.routes())
    })

    // plugins

    app.use(async (ctx, next) => {
      // ctx.body = 'Hello World';
      await next()
    })
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
