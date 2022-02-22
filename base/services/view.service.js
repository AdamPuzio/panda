'use strict'

const Panda = require('../../')
const { PandaError, PandaClientError, PageNotFoundError, ValidationError, UnauthorizedError, ForbiddenError } = Panda.Errors
const logger = Panda.Logger.getLogger('VIEW')
const ejs = require('ejs')
const fs = require('fs/promises')
const path = require('path')

const localApp = Panda.App.app('web')

module.exports = {
  name: 'view',

  mixins: [],

  settings: {},

  actions: {

    render: {
      params: {
        view: { type: 'string', optional: false },
        data: { type: 'object', optional: true },
        cfg: { type: 'object', optional: true }
      },
      async handler (ctx) {
        const params = ctx.params

        return await this.render(params.view, params.data, params.cfg)
      }
    }
  },

  methods: {
    async render (view, data={}, opts={}) {
      let viewsDir = localApp.viewsDir
      let relPath = path.dirname(path.join(viewsDir, view))
      let viewsPaths = [viewsDir]
      if(relPath !== viewsDir) viewsPaths.push(relPath)
      if(opts.layout) {
        let layoutDir = path.dirname(path.join(viewsDir, opts.layout))
        if(layoutDir !== viewsDir) viewsPaths.push(layoutDir)
      }
      let options = Object.assign({}, {
        root: viewsDir,
        views: viewsPaths,
        layout: false,
        viewExt: 'html',
        cache: false,
        debug: false
      }, opts)
      let str = await this.getView(view)
      let output = ''
      try {
        output = ejs.render(str, options)
        if(options.layout) {
          let layout = await this.getView(options.layout)
          output = ejs.render(layout, { body: output }, options)
        }
      } catch (e) {
        logger.error(e)
        output = '404 Page Not Found'
        // throw new PageNotFoundError()
      }
      return output
    },

    async getView(view, encoding = 'utf-8') {
      let viewFile = path.join(localApp.viewsDir, view + '.html')
      let fileStr = await fs.readFile(viewFile, { encoding })
      return fileStr
    }
  }
}