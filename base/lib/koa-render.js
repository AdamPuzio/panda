'use strict'

const fs = require('fs')
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

  const viewsDirs = appCfg.views

  viewsDirs.forEach((viewDir) => {
    if (!viewDir.views) return
    viewDir.views.forEach((v) => {
      viewCache[v.view] = v
    })
  })

  // override `ejs` node_module `resolveInclude` function
  ejs.resolveInclude = function (name, filename, isDir) {
    return viewCache[name].path
    /* if (!path.extname(name)) {
      name += '.html'
    }

    const viewsDir = path.join(Panda.APP_PATH, 'app', 'views')
    return path.join(viewsDir, name) */
  }

  /**
   * generate html with view name and options
   * @param {String} view
   * @param {Object} options
   * @return {String} html
   */
  async function render (view, options) {
    // view += settings.viewExt
    // const viewPath = path.join(settings.root, view)
    const viewInfo = viewCache[view]
    // debug(`render: ${viewPath}`);
    // get from cache
    if (settings.cache && settings.cache[view]) {
      return settings.cache[view].call(options.scope, options)
    }

    const tpl = fs.readFileSync(viewInfo.path, 'utf8')

    const fn = ejs.compile(tpl, {
      // filename: viewInfo.path,
      // _with: settings._with,
      compileDebug: settings.debug && settings.compileDebug,
      debug: settings.debug,
      delimiter: settings.delimiter,
      cache: settings.cache,
      async: settings.async,
      outputFunctionName: settings.outputFunctionName
    })
    if (settings.cache) {
      settings.cache[viewInfo] = fn
    }

    return fn.call(options.scope, options)
  }

  app.context.cmp = async function (cmp, cfg = {}) {
    return await app.broker.call('component.render', { cmp, cfg })
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
