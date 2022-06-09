'use strict'

const Panda = require('../../')
const Core = require('panda-core')
const ctx = Panda.ctx
const Hub = require('../../src/hub')
const Koa = require('koa')
const serve = require('koa-static')

const appCfg = Hub.getAppConfig('static')
const appBaseCfg = appCfg.app

module.exports = {
  name: 'static',

  settings: {
    port: process.env._PORT || appBaseCfg.port || 5100
  },

  async created () {
    const app = this.app = new Koa()
    app.broker = app.context.broker = this.broker
    const nodeEnv = process.env.NODE_ENV || 'development'
    const logger = Core.Logger.getLogger()
    logger.debug(`Static server running in ${nodeEnv} mode`)

    // const projectCfg = Hub.getAppConfig('static')

    logger.info(`Serving from: ${ctx.cwd}`)
    app.use(serve(ctx.cwd))

    app.use(async (ctx, next) => {
      const start = Date.now()

      await next()

      const ms = Date.now() - start
      ctx.set('X-Response-Time', `${ms}ms`)
      logger.http(`${ctx.method} ${ctx.url} (${ctx.status}) - ${ms}ms`)
    })
  },

  started () {
    this.app.listen(Number(this.settings.port), err => {
      if (err) { return this.broker.fatal(err) }

      this.logger.info(`static server started on port ${this.settings.port}`)
    })
  },

  stopped () {
    if (this.app.listening) {
      this.app.close(err => {
        if (err) { return this.logger.error('static server close error!', err) }

        this.logger.info('static server stopped!')
      })
    }
  }
}
