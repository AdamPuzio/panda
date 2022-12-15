'use strict'

const fs = require('fs-extra')
const ejs = require('ejs')

const defaultSettings = {
  cache: false,
  layout: false,
  viewExt: 'html',
  locals: {},
  compileDebug: false,
  debug: false,
  writeResp: true,
  async: true
}

const settings = { ...{}, ...defaultSettings }

const viewCache = {}

/**
 * set app.context.render
 *
 * usage:
 * ```
 * await ctx.render('user', {name: 'dead_horse'});
 * ```
 * @param {Application} app koa application instance
 * @param {Object} settings user settings
 */
exports = module.exports = function (app, appCfg) {
  if (app.context.render) {
    return
  }
  settings.viewExt = settings.viewExt
    ? '.' + settings.viewExt.replace(/^\./, '')
    : ''

  settings.includer = function (originalPath, parsedPath) {
    const view = viewCache[originalPath].live
    return { filename: view }
  }

  const views = appCfg.views
  views.forEach((view) => {
    viewCache[view.viewName] = view
  })

  // override `ejs` node_module `resolveInclude` function
  ejs.resolveInclude = function (name, filename, isDir) {
    return viewCache[name].live
  }

  /**
   * generate html with view name and options
   * @param {String} view
   * @param {Object} options
   * @return {String} html
   */
  async function render (view, options) {
    const viewInfo = viewCache[view]

    if (!viewInfo) throw new Error(`View "${view}" does not exist`)

    // get from cache
    if (settings.cache && settings.cache[view]) {
      return settings.cache[view].call(options.scope, options)
    }

    const tpl = fs.readFileSync(viewInfo.live, 'utf8')

    const fn = ejs.compile(tpl, {
      compileDebug: settings.debug && settings.compileDebug,
      debug: settings.debug,
      delimiter: settings.delimiter,
      cache: settings.cache,
      async: settings.async,
      outputFunctionName: settings.outputFunctionName,
      includer: settings.includer
    })
    if (settings.cache) {
      settings.cache[viewInfo] = fn
    }

    return fn.call(options.scope, options)
  }

  app.context.cmp = async function (cmp, cfg = {}) {
    return await app.broker.call('component.render', { cmp, cfg })
  }

  app.context.include = function (cmp, cfg = {}) {
    console.log('INCLUDE')
  }

  app.context.render = async function (view, _context) {
    const ctx = this

    const context = Object.assign({ data: {} }, ctx.state, _context)

    let html = await render(view, context)

    const layout = context.layout === false ? false : (context.layout || settings.layout)
    if (layout) {
      // if using layout
      context.body = html
      html = await render(layout, context)
    }

    const writeResp = context.writeResp === false ? false : (context.writeResp || settings.writeResp)
    if (writeResp) {
      // normal operation
      ctx.type = 'html'
      ctx.body = html
    } else {
      // only return the html
      return html
    }
  }
}

/**
 * Expose ejs
 */

exports.ejs = ejs
