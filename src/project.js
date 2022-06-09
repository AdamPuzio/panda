'use strict'

const PandaCore = require('panda-core')
// const PandaSingleton = PandaCore.class.Singleton
const EventEmitter = require('events')
const ctx = PandaCore.ctx
const path = require('path')
const _ = require('lodash')
const glob = require('util').promisify(require('glob'))
const CacheBase = require('cache-base')

class PandaProject extends EventEmitter {
  constructor () {
    if (PandaProject._instance) return PandaProject._instance
    super()
    PandaProject._instance = this

    this._cache = new CacheBase()
  }

  entityMap = {
    apps: { registerFn: 'registerApps' },
    services: { registerFn: 'registerServices' },
    packages: { registerFn: 'registerPackages' },
    static: { jsonKey: 'publicDir', registerFn: 'registerStaticDir' },
    routes: { jsonKey: 'routesDir', registerFn: 'registerRoutesDir' },
    components: { jsonKey: 'componentsDir', registerFn: 'registerComponentsDir' },
    views: { jsonKey: 'viewsDir', registerFn: 'registerViewsDir' }
  }

  appMap = {
    web: {
      name: 'web',
      core: true,
      base: '{PANDA_PATH}',
      path: 'base/apps/web.app.js'
    },
    api: {
      name: 'api',
      core: true,
      base: '{PANDA_PATH}',
      path: 'base/apps/api.app.js'
    }
  }

  serviceMap = {
    project: {
      name: 'project',
      core: true,
      base: '{PANDA_PATH}',
      path: 'base/services/project.service.js'
    },
    component: {
      name: 'component',
      core: true,
      base: '{PANDA_PATH}',
      path: 'base/services/component.service.js'
    }
  }

  baseObj = {
    apps: [],
    services: [],
    static: [],
    routes: [],
    packages: [],
    components: [],
    views: []
  }

  projectInfo () {
    if (!ctx.PROJECT_PATH) throw new Error(`${ctx.PROJECT_PATH} is not a valid path`)
    const projectJson = require(path.join(ctx.PROJECT_PATH, 'project.json'))
    return projectJson
  }

  async live (data) {
    if (!data) data = await this.build()
    const out = {}
    Object.entries(data.shrinkwrap).forEach(([k, v]) => {
      out[k] = v.map((i) => {
        if (i.path) i.path = this.tpl(i.path)
        if (i.files) {
          i.files = i.files.map((f) => {
            return this.tpl(f)
          })
        }
        if (i.views) {
          i.views = i.views.map((f) => {
            return {
              ...f,
              ...{
                path: this.tpl(f.path)
              }
            }
          })
        }
        return i
      })
    })
    return out
  }

  async build () {
    const svcMap = { services: this.reduce(Object.values(this.serviceMap), null, { applyTpl: true }) }
    let rollup = await this.rollup()
    function customizer (objValue, srcValue) {
      if (_.isArray(objValue)) {
        return objValue.concat(srcValue)
      }
    }
    rollup = _.mergeWith({}, this.baseObj, svcMap, rollup, customizer)
    const shrinkwrap = await this.shrinkwrap({ ...{}, ...rollup })

    return { rollup, shrinkwrap }
  }

  async rollup (json, pkg) {
    if (!json) json = this.projectInfo()
    const projectObj = {}
    await Promise.all(Object.entries(this.entityMap).map(async ([name, info]) => {
      if (json[info.jsonKey || name]) projectObj[name] = await this[info.registerFn](json[info.jsonKey || name], pkg, info)
    }))
    return projectObj
  }

  async shrinkwrap (obj, rollup = {}, pkg) {
    if (!obj) obj = await this.rollup()
    await Promise.all(Object.entries(obj).map(async ([k, v]) => {
      if (!rollup[k]) rollup[k] = []
      await Promise.all(Object.entries(v).map(async ([x, y]) => {
        // if import, run _rollup on that object
        if (y.import) rollup = await this.shrinkwrap(y.import, rollup, y)
        const omit = _.omit(y, 'import')
        if (pkg) omit._pkg = _.omit(pkg, 'import')
        rollup[k].push(omit)
      }))
    }))
    return rollup
  }

  pathList (cwd, pkg) {
    if (!cwd) cwd = ctx.PROJECT_PATH
    if (this._cache.has(`pathList@${cwd}:${pkg || 'X'}`)) return this._cache.get(`pathList@${cwd}:${pkg || 'X'}`)
    const pathList = {
      PACKAGE_PATH: '{PACKAGES_PATH}' + pkg
    }
    Object.entries(pathList).forEach(([k, v]) => {
      const rel = v.replace(cwd, '')
      pathList[k] = rel
    })
    this._cache.set(`pathList@${cwd}:${pkg || 'X'}`, pathList)
    return pathList
  }

  /**
   * Reduce possible path formats to a common format
   *
   * Examples:
   * - {PANDA_PATH}/base/web.service.js > /panda/path/base/web.service.js
   * - { base: 'APP_PATH', path: 'app/services' } > /project/path/app/services
   * - { package: 'panda-search', path: 'models/search.model.js' } > /project/path/node_modules/models/search.model.js
   *
   * @param {*} opt
   * @returns
   */
  reduce (opt, pkg, opts = {}) {
    opts = {
      ...{
        preFn: null,
        postFn: null,
        applyTpl: true
      },
      ...opts
    }

    _.templateSettings.interpolate = /{([\s\S]+?)}/g
    if (Array.isArray(opt)) return opt.map((o, i) => { return this.reduce(o, pkg, opts) })
    if (opts.preFn) opt = opts.preFn(opt)
    switch (typeof opt) {
      case 'string':
        const upopt = opt.replace('{PACKAGE_PATH}', '{PACKAGES_PATH}/' + pkg) // eslint-disable-line
        opt = {
          path: upopt.includes('${') ? upopt : upopt.replace('{', '${ctx.')
        }
        break
      case 'object':
        const p = [] // eslint-disable-line
        const paths = ['base', 'path'] // eslint-disable-line
        if (!opt.path && opt.package) opt.path = opt.package
        paths.forEach((i) => {
          if (opt[i]) { p.push(opt[i]); delete opt[i] }
        })
        const upoptx = path.join(...p).replace('{PACKAGE_PATH}', '{PACKAGES_PATH}/' + pkg) // eslint-disable-line
        opt.path = upoptx.includes('${') ? upoptx : upoptx.replace('{', '${ctx.')
    }
    if (opts.postFn) opt = opts.postFn(opt)
    return opt
  }

  async registerApps (apps, pkg) {
    const preFn = (obj) => {
      if (obj.app) {
        const app = this.appMap[obj.app]
        if (!app) throw new Error(`${app} is not a valid app name; please check your configuration`)
        obj = { ...app, ...obj }
      }
      return obj
    }
    const postFn = (obj) => {
      obj.name = obj.name || obj.path.split('/').pop().replace('.app.js', '')
      return obj
    }
    return this.reduce(apps, pkg, { preFn, postFn })
  }

  async registerServices (services, pkg) {
    const postFn = (obj) => {
      if (!obj.name) obj.name = obj.path.split('/').pop().replace('.service.js', '')
      return obj
    }
    return this.reduce(services, pkg, { postFn })
  }

  async registerPackages (packages, pkg) {
    packages = await Promise.all(packages.map(async (i) => {
      i = this.reduce(i, pkg)
      const requireStr = this.tpl(path.join(i.path, 'package.json'))
      const packageJson = require(requireStr)
      if (packageJson.panda) i.import = await this.rollup(packageJson.panda, i.package)
      return i
    }))
    return packages
  }

  tpl (tpl) {
    return eval('`' + tpl + '`') // eslint-disable-line
  }

  async registerStaticDir (dir, pkg) {
    if (!Array.isArray(dir)) dir = [dir]
    return this.reduce(dir, pkg)
  }

  async registerRoutesDir (dir, pkg) {
    if (!Array.isArray(dir)) dir = [dir]
    dir = await Promise.all(dir.map(async (i) => {
      i = this.reduce(i, pkg)
      const files = await glob(path.join(this.tpl(i.path), '/**/*.js'))
      i.files = await Promise.all(files.map(async (file) => {
        const relpath = file.replace(ctx.PROJECT_PATH, '${ctx.PROJECT_PATH}') // eslint-disable-line
        return relpath
      }))
      return i
    }))
    return dir
  }

  async registerComponentsDir (dir, pkg) {
    if (!Array.isArray(dir)) dir = [dir]
    dir = await Promise.all(dir.map(async (i) => {
      i = this.reduce(i, pkg)
      const files = await glob(path.join(this.tpl(i.path), '/**/component.json'))
      i.components = await Promise.all(files.map(async (file) => {
        const relpath = file.replace(ctx.PROJECT_PATH, '${ctx.PROJECT_PATH}') // eslint-disable-line
        const cmp = require(file)
        return {
          name: cmp.name,
          namespace: cmp.namespace,
          path: relpath,
          config: cmp
        }
      }))
      return i.components
    }))
    return dir.flat()
  }

  async registerViewsDir (dir, pkg) {
    if (!Array.isArray(dir)) dir = [dir]
    dir = await Promise.all(dir.map(async (i) => {
      i = this.reduce(i, pkg)
      const files = await glob(path.join(this.tpl(i.path), '/**/*.html'))
      i.views = await Promise.all(files.map(async (file) => {
        const relpath = file.replace(ctx.PROJECT_PATH, '${ctx.PROJECT_PATH}') // eslint-disable-line
        let view = file.replace(this.tpl(i.path), '').slice(1, -5)
        if (pkg) view = `${pkg}:${view}`
        return {
          path: relpath,
          view
        }
      }))
      return i
    }))
    return dir
  }
}

module.exports = new PandaProject()
