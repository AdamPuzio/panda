#!/usr/bin/env node

'use strict'

const Core = require('panda-core')
const ctx = Core.ctx
const Wasp = Core.Wasp
const program = new Wasp.Command()
const Koa = require('koa')
const serve = require('koa-static')

program
  .description('Serve static content from the current directory')
  .action(async function (opts, cmd) {
    this.debug('command: serve')

    this.heading('Serve static content from the current directory')

    const port = process.env.PORT || 5100
    const app = new Koa()
    this.info(`serving from: ${ctx.cwd}`)
    app.use(serve(ctx.cwd))

    app.use(async (ctx, next) => {
      const start = Date.now()

      await next()

      const ms = Date.now() - start
      ctx.set('X-Response-Time', `${ms}ms`)
      this.logger.http(`${ctx.method} ${ctx.url} (${ctx.status}) - ${ms}ms`)
    })

    app.listen(Number(port), err => {
      if (err) return this.logger.fatal(err)

      this.info(`static server started on port ${port}`)
    })
  })
  .parse(process.argv)
