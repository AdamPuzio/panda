'use strict'

const PandaCore = require('panda-core')
const PandaSingleton = PandaCore.class.Singleton
const ctx = PandaCore.ctx
const path = require('path')
const _ = require('lodash')
const glob = require('util').promisify(require('glob'))
const fs = require('fs-extra')
const CacheBase = require('cache-base')
const { cmp } = require('semver')

class PandaProject extends PandaSingleton {
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
      name: "web",
      core: true,
      base: "{PANDA_PATH}",
      path: "base/apps/web.app.js"
    },
    api: {
      name: "api",
      core: true,
      base: "{PANDA_PATH}",
      path: "base/apps/api.app.js"
    }
  }

  serviceMap = {
    project: {
      name: 'project',
      core: true,
      base: "{PANDA_PATH}",
      path: 'base/services/project.service.js'
    },
    component: {
      name: 'component',
      core: true,
      base: "{PANDA_PATH}",
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
    const projectJson = require(path.join(ctx.PROJECT_PATH, 'project.json'))
    return projectJson
  }

  async live (data) {
    if (!data) data = await this.build()
    const out = {}
    Object.entries(data.shrinkwrap).forEach(([k, v]) => {
      out[k] = v.map((i) => {
        if (i.path) i.path = this.tpl(i.path)
        if (i.files) i.files = i.files.map((f) => {
          return this.tpl(f)
        })
        if (i.views) i.views = i.views.map((f) => {
          return {...f, ...{
            path: this.tpl(f.path)
          }}
        })
        return i
      })
    })
    //console.log(JSON.stringify(build, null, 2))
    return out
  }

  async build () {
    /*console.log({
      serviceMap: this.serviceMap,
      reduce: this.reduce(Object.values(this.serviceMap), null, { applyTpl: false })
    })*/
    //const svcMap = { services: Object.values(this.serviceMap) }
    const svcMap = { services: this.reduce(Object.values(this.serviceMap), null, { applyTpl: true }) }
    let rollup = await this.rollup()
    function customizer(objValue, srcValue) {
      if (_.isArray(objValue)) {
        return objValue.concat(srcValue)
      }
    }
    rollup = _.mergeWith({}, this.baseObj, svcMap, rollup, customizer)
    const shrinkwrap = await this.shrinkwrap({...{}, ...rollup})

    return { rollup, shrinkwrap }
  }

  async rollup (json, pkg) {
    if (!json) json = this.projectInfo()
    const projectObj = {}
    await Promise.all(Object.entries(this.entityMap).map(async ([name, info]) => {
      if (json[info.jsonKey || name]) projectObj[name] = await this[info.registerFn](json[info.jsonKey || name], pkg, info)
      return
    }))
    return projectObj
  }

  async shrinkwrap (obj, rollup={}, pkg) {
    if (!obj) obj = await this.rollup()
    await Promise.all(Object.entries(obj).map(async ([k, v]) => {
      if (!rollup[k]) rollup[k] = []
      await Promise.all(Object.entries(v).map(async ([x, y]) => {
        // if import, run _rollup on that object
        if (y.import) rollup = await this.shrinkwrap(y.import, rollup, y)
        const omit = _.omit(y, 'import')
        if (pkg) omit._pkg = _.omit(pkg, 'import')
        rollup[k].push(omit)
        return
      }))
      return
    }))
    return rollup
  }


  pathList (cwd, pkg) {
    if (!cwd) cwd = ctx.PROJECT_PATH
    if (this._cache.has(`pathList@${cwd}:${pkg || 'X'}`)) return this._cache.get(`pathList@${cwd}:${pkg || 'X'}`)
    /*let pathList = { 
      PANDA_PATH: ctx.PANDA_PATH, 
      PROJECT_PATH: ctx.PROJECT_PATH,
      PACKAGES_PATH: path.join(ctx.PROJECT_PATH, 'node_modules') 
    }*/
    let pathList = {
      //'{': '${ctx.'
      PACKAGE_PATH: '{PACKAGES_PATH}' + pkg
    }
    //if (pkg) pathList.PACKAGE_PATH = path.join(ctx.PROJECT_PATH, 'node_modules', pkg) 
    Object.entries(pathList).forEach(([k, v]) => {
      const rel = v.replace(cwd, '')
      pathList[k] = rel
    })
    this._cache.set(`pathList@${cwd}:${pkg || 'X'}`, pathList)
    return pathList
  }
  /*pathList (cwd, pkg) {
    if (!cwd) cwd = ctx.PROJECT_PATH
    if (this._cache.has(`pathList@${cwd}:${pkg || 'X'}`)) return this._cache.get(`pathList@${cwd}:${pkg || 'X'}`)
    let pathList = { 
      PANDA_PATH: ctx.PANDA_PATH, 
      PROJECT_PATH: ctx.PROJECT_PATH,
      PACKAGES_PATH: path.join(ctx.PROJECT_PATH, 'node_modules') 
    }
    if (pkg) pathList.PACKAGE_PATH = path.join(ctx.PROJECT_PATH, 'node_modules', pkg) 
    Object.entries(pathList).forEach(([k, v]) => {
      const rel = v.replace(cwd, '')
      pathList[k] = rel
    })
    this._cache.set(`pathList@${cwd}:${pkg || 'X'}`, pathList)
    return pathList
  }*/

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
  reduce (opt, pkg, opts={}) {
    opts = {...{
      preFn: null,
      postFn: null,
      applyTpl: true
    }, ...opts}
    /*console.log({
      loc: 'Project.reduce() IN',
      opt
    })*/
    _.templateSettings.interpolate = /{([\s\S]+?)}/g
    const pathList = this.pathList(null, pkg)
    if (Array.isArray(opt)) return opt.map((o, i) => { return this.reduce(o, pkg, opts) })
    if (opts.preFn) opt = opts.preFn(opt)
    switch (typeof opt) {
      case 'string':
        //const upopt = _.template(opt)(pathList)
        const upopt = opt.replace('{PACKAGE_PATH}', '{PACKAGES_PATH}/' + pkg)
        opt = {
          //path: _.template(opt)(pathList)
          //path: opts.applyTpl ? upopt.replace('{', '${ctx.') : upopt
          path: upopt.includes('${') ? upopt : upopt.replace('{', '${ctx.')
        }
        break
      case 'object':
        const p = []
        const paths = ['base', 'path']
        if (!opt.path && opt.package) opt.path = opt.package
        paths.forEach((i) => {
          if (opt[i]) { p.push(opt[i]); delete opt[i] }
        })
        //opt.path = _.template(path.join(...p))(pathList)
        const upoptx = path.join(...p).replace('{PACKAGE_PATH}', '{PACKAGES_PATH}/' + pkg)
        opt.path = upoptx.includes('${') ? upoptx : upoptx.replace('{', '${ctx.')
        //opt.path = opts.applyTpl ? upoptx.replace('{', '${ctx.') : upoptx
    }
    if (opts.postFn) opt = opts.postFn(opt)
    /*console.log({
      loc: 'Project.reduce() OUT',
      opt
    })*/
    return opt
  }
  /*reduce (opt, pkg, opts={}) {
    opts = {...{
      preFn: null,
      postFn: null
    }, ...opts}
    _.templateSettings.interpolate = /{([\s\S]+?)}/g
    const pathList = this.pathList(null, pkg)
    if (Array.isArray(opt)) return opt.map((o, i) => { return this.reduce(o, pkg, opts) })
    if (opts.preFn) opt = opts.preFn(opt)
    switch (typeof opt) {
      case 'string':
        opt = {
          path: _.template(opt)(pathList)
        }
        break
      case 'object':
        const p = []
        const paths = ['base', 'path']
        if (!opt.path && opt.package) opt.path = opt.package
        paths.forEach((i) => {
          if (opt[i]) { p.push(opt[i]); delete opt[i] }
        })
        opt.path = _.template(path.join(...p))(pathList)
    }
    if (opts.postFn) opt = opts.postFn(opt)
    return opt
  }*/

  async registerApps (apps, pkg) {
    const preFn = (obj) => {
      if (obj.app) {
        const app = this.appMap[obj.app]
        if (!app) throw new Error(`${app} is not a valid app name; please check your configuration`)
        obj = {...app, ...obj}
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
      //const packageJson = require(path.join(ctx.PROJECT_PATH, i.path, 'package.json'))
      //const ctx = PandaCore.ctx
      //const joinStr = path.join(i.path, 'package.json')
      const requireStr = this.tpl(path.join(i.path, 'package.json'))
      /*console.log({
        i,
        joinStr,
        requireStr
      })*/
      const packageJson = require(requireStr)
      //const packageJson = require(this.tpl(path.join(i.path, 'package.json')))
      //const packageJson = require(path.join(i.path, 'package.json'))
      if (packageJson.panda) i.import = await this.rollup(packageJson.panda, i.package)
      return i
    }))
    return packages
  }

  tpl (tpl) {
    /*console.log('ATTEMPT:')
    console.log(tpl)
    console.log({
      tpl,
      eval: eval('`'+tpl+'`'),
      loc: 'Project.tpl'
    })*/
    return eval('`'+tpl+'`')
  }

  async registerStaticDir (dir, pkg) { 
    if (!Array.isArray(dir)) dir = [dir]
    return this.reduce(dir, pkg) 
  }

  async registerRoutesDir (dir, pkg) {
    if (!Array.isArray(dir)) dir = [dir]
    dir = await Promise.all(dir.map(async (i) => {
      i = this.reduce(i, pkg)
      //let files = await glob(path.join(ctx.PROJECT_PATH, i.path, '/**/*.js'))
      let files = await glob(path.join(this.tpl(i.path), '/**/*.js'))
      i.files = await Promise.all(files.map(async (file) => {
        const relpath = file.replace(ctx.PROJECT_PATH, '${ctx.PROJECT_PATH}')
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
      let files = await glob(path.join(this.tpl(i.path), '/**/component.json'))
      //let files = await glob(path.join(ctx.PROJECT_PATH, i.path, '/**/component.json'))
      i.components = await Promise.all(files.map(async (file) => {
        const relpath = file.replace(ctx.PROJECT_PATH, '${ctx.PROJECT_PATH}')
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
      let files = await glob(path.join(this.tpl(i.path), '/**/*.html'))
      i.views = await Promise.all(files.map(async (file) => {
        const relpath = file.replace(ctx.PROJECT_PATH, '${ctx.PROJECT_PATH}')
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