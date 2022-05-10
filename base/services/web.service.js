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
const path = require('path')

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
        case err instanceof ForbiddenError:
          return res.status(err.code).send('You do not have the proper permissions')
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
    app.broker = app.context.broker = this.broker
    const nodeEnv = process.env.NODE_ENV || 'development'

    app.use(cors())
    app.use(bodyParser())

    /* app.on('error', err => {
      logger.error('server error', err)
    }) */

    // if views directory exists, let's use koa-views and ejs as our template renderer
    if (localApp.viewsDir) {
      const render = require('../lib/koa-ejs')
      render(app, {
        root: localApp.viewsDir,
        includer: function (originalPath, parsedPath) {
          const filename = path.join(localApp.viewsDir, originalPath + '.html')
          const fileExists = Panda.Utility.fileExistsSync(filename)
          if (!fileExists) {
            logger.error(`Trying to access a view that does not exist: ${originalPath}`)
            const tpl = (nodeEnv === 'production') ? '-' : 'missing view: ' + originalPath
            return { template: tpl }
          }
        }
      })
    }

    app.use(this.establishSession(app))

    // simply for processing response time
    app.use(async (ctx, next) => {
      ctx.state = ctx.state || {}
      ctx.state._url = ctx.originalUrl
      ctx.state._env = ctx.app.env
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
    console.log('this settings: ', this.settings);
    console.log('port listening: ', this.settings.port);
    if(this.app.listening){
      this.logger.info(`app is listening to port already`)
    }
    else {
      this.app.listen(Number(this.settings.port), err => {
        if (err) { return this.broker.fatal(err) }
  
        this.logger.info(`web server started on port ${this.settings.port}`)
      })
    }
  
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
