'use strict'

const Context = require('../../src/context')
const ctx = Context.ctx
const Hub = require('../../src/hub')
const CacheBase = require('cache-base')
const fs = require('fs-extra')
const ejs = require('ejs')
const path = require('path')

const cache = new CacheBase()

module.exports = {
  name: 'component',
  actions: {
    get: {
      params: {
        cmp: { type: 'string', optional: false }
      },
      async handler (ctx) {
        return this.getCmp(ctx.params.cmp)
      }
    },

    render: {
      params: {
        cmp: { type: 'string', optional: false },
        cfg: { type: 'object', optional: false }
      },
      async handler (ctx) {
        const cmp = this.getCmp(ctx.params.cmp)
        const renderCmp = await ejs.render(cmp._webView, { data: ctx.params.cfg }, { async: true })
        return renderCmp
      }
    }
  },

  methods: {
    getCmp (ns) {
      const cmp = cache.get(ns)
      if (!cmp) throw new Error(`${ctx.params.cmp} is not a valid component`)
      if (!cmp._webView) {
        // const cmpPath = path.join(ctx.PROJECT_PATH, path.dirname(cmp.cmp.path))
        const cmpPath = path.dirname(cmp.cmp.live)
        const webViewPath = path.resolve(cmpPath, cmp.cmp.config.webView)
        cmp._webView = fs.readFileSync(webViewPath, { encoding: 'utf8' })
        cache.set(ns, cmp)
      }
      return cmp
    }
  },

  async created () {
    const projectInfo = Hub.projectInfo()
    projectInfo.components.forEach((cmp) => {
      cache.set(cmp.namespace, { cmp })
    })
  }
}
