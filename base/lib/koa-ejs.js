/*!
 * adapted from koa-ejs (https://github.com/koajs/ejs)
 */

'use strict'

/**
 * Module dependencies.
 */

const Panda = require('../../')
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')

/**
 * Temp assigned for override later
 */
// const parentResolveInclude = ejs.resolveInclude

/**
 * default render options
 * @type {Object}
 */
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
exports = module.exports = function (app, settings) {
  if (app.context.render) {
    return
  }

  if (!settings || !settings.root) {
    throw new Error('settings.root required')
  }

  settings.root = path.resolve(process.cwd(), settings.root)

  /**
   * cache the generate package
   * @type {Object}
   */
  const cache = Object.create(null)

  settings = Object.assign({}, defaultSettings, settings)

  settings.viewExt = settings.viewExt
    ? '.' + settings.viewExt.replace(/^\./, '')
    : ''

  // override `ejs` node_module `resolveInclude` function
  ejs.resolveInclude = function (name, filename, isDir) {
    if (!path.extname(name)) {
      name += settings.viewExt
    }

    const viewsDir = path.join(Panda.APP_PATH, 'app', 'views')
    return path.join(viewsDir, name)
  }

  /**
   * generate html with view name and options
   * @param {String} view
   * @param {Object} options
   * @return {String} html
   */
  async function render (view, options) {
    view += settings.viewExt
    const viewPath = path.join(settings.root, view)
    // debug(`render: ${viewPath}`);
    // get from cache
    if (settings.cache && cache[viewPath]) {
      return cache[viewPath].call(options.scope, options)
    }

    const tpl = fs.readFileSync(viewPath, 'utf8')

    const fn = ejs.compile(tpl, {
      filename: viewPath,
      _with: settings._with,
      compileDebug: settings.debug && settings.compileDebug,
      debug: settings.debug,
      delimiter: settings.delimiter,
      cache: settings.cache,
      async: settings.async,
      outputFunctionName: settings.outputFunctionName
    })
    if (settings.cache) {
      cache[viewPath] = fn
    }

    return fn.call(options.scope, options)
  }

  app.context.render = async function (view, _context) {
    const ctx = this

    const context = Object.assign({}, ctx.state, _context)

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
