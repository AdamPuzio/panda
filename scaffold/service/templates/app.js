'use strict'

const Panda = require('panda')
const logger = Panda.getLogger('<%-data.name%>')
const ApiGateway = require('moleculer-web')
const Koa = require('koa')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')

const localApp = Panda.App.app('<%-data.slug%>')

module.exports = {
  name: '<%-data.slug%>',
  mixins: [ApiGateway],

  settings: {
    port: process.env.<%-data.envslug%>_PORT || localApp.port || <%-data.port%>
  },

  dependencies: [],

  methods: {},

  async created () {
    const app = this.app = new Koa()
    const broker = app.broker = this.broker

    app.use(cors())
    app.use(bodyParser())

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

    // routes here
  },

  started () {
    this.app.listen(Number(this.settings.port), err => {
      if (err) { return this.broker.fatal(err) }

      this.logger.info(`<%-data.slug%> server started on port ${this.settings.port}`)
    })
  },

  stopped () {
    if (this.app.listening) {
      this.app.close(err => {
        if (err) { return this.logger.error('<%-data.slug%> server close error!', err) }

        this.logger.info('<%-data.slug%> server stopped!')
      })
    }
  }
}
