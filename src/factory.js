'use strict'

const PandaSingleton = require('./class/singleton')
const Context = require('./context')
//const Utility = require('./utility')
const _ = require('lodash')
const ctx = Context.ctx
const path = require('path')
const fs = require('fs-extra')
const glob = require('util').promisify(require('glob'))
const CacheBase = require('cache-base')

class PandaFactory extends PandaSingleton {
  scaffoldDir = null
  projectDir = null

  constructor () {
    if (PandaFactory._instance) return PandaFactory._instance
    super()
    PandaFactory._instance = this

    // do a little bit of magic, if it's none of these it should be set via setProjectDir()
    this.projectDir = ctx.PROJECT_PATH || ctx.PACKAGE_PATH || ctx.cwd

    this._cache = new CacheBase()

    this.debug('init PandaFactory')
  }

  // patterns used to search
  patterns = {
    js: '/**/*.js',
    dirs: '*/',
    scaffolds: '/**/scaffold.js'
  }

  setScaffoldSource (src, dir = '') {
    this.debug(`Factory.setScaffoldSource(${src})`)
    this.scaffoldDir = Context.path(path.join(src, dir))
    this.emit('update-scaffold-source', this.scaffoldDir)
  }

  setProjectDir (dir) {
    this.debug(`Factory.setProjectDir(${dir})`)
    if (!dir) throw new Error(`Factory.setProjectDir() Error: invalid dir variable - ${dir}`)
    this.projectDir = Context.path(dir)
    this.emit('update-project-directory', this.projectDir)
  }

  /**
   * Get a scaffold
   *
   * @param {String} scaffold
   * @returns
   */
  async getScaffold (scaffold, opts = {}) {
    if (!scaffold) throw new Error(`No scaffold provided`)
    // if no subtype is provided, assume default
    if (!scaffold.includes('/')) scaffold += '/' + scaffold
    const scaffSplit = scaffold.split('/')
    const entity = scaffSplit[0]
    const scaff = scaffSplit[1]

    const entityList = await this.getScaffoldList(entity, opts)

    let match
    entityList.forEach(e => {
      if (e.path === scaffold) match = e
    })

    if (!match) throw new Error(`No matching Scaffold found: ${scaffold}`)
    return require(match.file)
  }

  /**
   * Get a list of all scaffolds
   * 
   * @param {String} entity (optional) an entity to filter by
   * @param {*} opts 
   * @returns 
   */
  async getScaffoldList (entity, opts = {}) {
    const dir = path.join(this.scaffoldDir, entity || '')
    const entityList = await this.parseScaffoldDir(dir)

    return entityList
  }

  /**
   * Parse a specific directory looking for scaffolds
   * 
   * @param {String} dir 
   * @returns 
   */
  async parseScaffoldDir (dir) {
    if (this._cache.has(`scaffold-dir:${dir}`)) return this._cache.get(`scaffold-dir:${dir}`)
    const scaffoldList = []
    const pattern = this.patterns.scaffolds
    const files = await glob(path.join(dir, pattern))
    files.forEach((file) => {
      const scaffoldPath = path.dirname(file).replace(this.scaffoldDir + path.sep, '')
      const [scaffType, scaffSlug] = scaffoldPath.split(path.sep)
      
      try {
        const load = require(file)
        const data = load.data()
        const ns = data.namespace
        scaffoldList.push({
          ...{
            path: scaffoldPath,
            type: scaffType,
            slug: scaffSlug,
            file
          },
          ...data
        })
      } catch (err) {
        throw new Error(`Scaffolding file cannot be loaded: ${file}`, err)
      }
    })
    this._cache.set(`scaffold-dir:${dir}`, scaffoldList)
    return scaffoldList
  }

  /**
   * Install a Package into the current Project
   *
   * @param {String} pkg
   * @param {*} opts
   * @returns
   */
  async installPackage (pkg, opts = {}) {
    opts = {
      ...{
        baseDir: ctx.cwd,
        stream: true,
        quiet: false,
        silent: true,
        saveDev: false,
        addToProject: true
      },
      ...opts
    }

    // validate a package is passed and we're in a Project
    if (!pkg) throw new Error('Please provide a Package to install')
    await Context.fns.confirmInProject()

    const pkgPath = path.join(opts.baseDir, 'package.json')

    // get the package info from NPM and validate it's a Panda package
    this.logger.verbose('Retrieving package information...')
    let packageInfo = await this.npmPackageInfo(pkg, { onError: 'throw' })
    if (!packageInfo.panda) throw new Error(`Package '${packageInfo.name}' is not a valid Panda Package`)
    this.logger.verbose(`Installing Package: ${packageInfo.name}@${packageInfo.version}`)

    // fetch the package.json
    const beforePackage = require(pkgPath)

    const flags = ['silent', 'quiet'].map((v) => { return opts[v] ? `--${v}` : '' }).join(' ')
    await this.runCommand(`cd ${opts.baseDir} && npm install ${pkg} ${flags}`, { stream: opts.stream })

    // fetch the package.json... again
    delete require.cache[pkgPath]
    const afterPackage = require(pkgPath)

    const packageDiff = Object.entries(afterPackage.dependencies).reduce((c, [k, v]) => Object.assign(c, beforePackage.dependencies[k] ? {} : { [k]: v }), {})
    // package.json hasn't changed, either return false or throw error
    if (!packageDiff) return false

    if (opts.addToProject) {
      this.logger.verbose(`Adding ${packageInfo.name} to project.json`)
      const projectJson = await this.readProjectJson()
      if (!projectJson.packages) projectJson.packages = []
      projectJson.packages.push({
        package: packageInfo.name,
        base: '{PACKAGES_PATH}',
        config: {}
      })
      await this.writeProjectJson(projectJson)
      this.logger.verbose(`Successfully added ${packageInfo.name} to project.json`)
    }

    return packageInfo
  }

  /**
   * Uninstall a Package from the current Project
   *
   * @param {String} pkg
   * @param {*} opts
   * @returns
   */
  async uninstallPackage (pkg, opts = {}) {
    opts = {
      ...{
        projectDir: this.projectDir,
        stream: true,
        quiet: false,
        silent: true,
        removeFromProject: true
      },
      ...opts
    }

    // validate a package is passed and we're in a Project
    if (!pkg) throw new Error('Please provide a Package to uninstall')
    await Context.fns.confirmInProject()

    // get package.json and confirm the pkg exists
    const packageJson = await this.readPackageJson()
    const depSearch = Object.keys(packageJson.dependencies).find((i) => i === pkg)
    if (!depSearch) throw new Error(`The package ${pkg} does not appear to be installed`)

    // handle the npm uninstall
    const flags = ['silent', 'quiet'].map((v) => { return opts[v] ? `--${v}` : '' }).join(' ')
    await this.runCommand(`npm uninstall ${pkg} ${flags}`, { stream: opts.stream })

    if (opts.removeFromProject) await this.removePackageFromProjectJson(pkg)
    
    return true
  }

  /**
   * Build a package.json file in the Project directory
   *
   * @param {Object} data
   * @param {Object} opts
   */
  async buildPackageJson (data, opts = {}) {
    const pandaVersion = await this.latestPackage()
    const pl = ctx.labelInfo

    const deps = {}
    if (pl.name === 'panda') deps.panda = `^${pandaVersion}`
    else deps[pl.name] = `^${pl.version}`

    let base = {
      name: '',
      version: '1.0.0',
      description: '',
      main: 'index.js',
      bin: {},
      scripts: {
        start: 'node index'
      },
      panda: {},
      keywords: [],
      author: '',
      license: '',
      dependencies: deps,
      devDependencies: {},
      engines: {
        node: '>= 14.0.0'
      }
    }

    // if a Private Label provides their own project base, use it
    if (pl.panda && pl.panda.projectBase) base = pl.panda.projectBase

    //return Utility._.merge(base, data)
    return _.merge({}, base, data)
  }

  /**
   * Apply tools to a package.json JSON object
   * 
   * @param {Object} pkg 
   * @param {Object} tools 
   * @returns 
   */
  async applyTools (pkg, tools = {}) {
    if (!pkg.scripts) pkg.scripts = {}
    if (tools.testTool) pkg.scripts.test = tools.testTool
    if (tools.lintTool) pkg.scripts.lint = tools.lintTool
    if (tools.cssTool) pkg.scripts.compileCss = tools.cssTool
    if (tools.buildTool) pkg.scripts.build = tools.buildTool
    if (!pkg.devDependencies) pkg.devDependencies = {}
    
    for (const [k, v] of Object.entries(tools)) {
      if (v) {
        const latest = await this.latestPackage(v)
        pkg.devDependencies[v] = `^${latest}`
      }
    }
    return pkg
  }

  /**
   * Retrieves the latest version of an NPM package
   *
   * @param {String} pkg
   * @returns
   */
  async latestPackage (pkg = 'panda') {
    const childProcess = require('child_process')
    return childProcess.execSync(`npm show ${pkg} version`, {}).toString().trim()
  }

  /**
   * Retrieves package.json in JSON format
   * 
   * @param {String} dir directory to look for package.json
   * @returns
   */
  async readPackageJson (dir, opts = {}) {
    if (!dir) dir = this.projectDir
    const file = path.join(dir, 'package.json')
    try {
      const json = require(file)
      return json
    } catch (e) {
      if (opts.onFail === 'empty') return {}
      throw e
    }
  }
  
  readPackageJsonSync (dir, opts = {}) {
    if (!dir) dir = this.projectDir
    const file = path.join(dir, 'package.json')
    try {
      const json = require(file)
      return json
    } catch (e) {
      if (opts.onFail === 'empty') return {}
      throw e
    }
  }

  /**
   * Writes to package.json
   *
   * @param {Object} content
   * @param {String} dir directory to look for package.json
   */
  async writePackageJson (content, dir = ctx.cwd) {
    if (typeof content === 'string') content = JSON.parse(content)
    const file = path.join(dir, 'package.json')
    await fs.outputJSON(file, content, { spaces: 2 })
  }

  /**
   * Retrieves project.json in JSON format
   *
   * @param {String} dir directory to look for package.json
   * @returns
   */
  async readProjectJson (dir = ctx.cwd) {
    const file = path.join(dir, 'project.json')
    return require(file)
  }

  /**
   * Writes to project.json
   * @param {String} content
   * @param {Object} opts
   */
  async writeProjectJson (content, dir = this.projectDir) {
    if (typeof content === 'string') content = JSON.parse(content)
    const file = path.join(dir, 'project.json')
    await fs.outputJSON(file, content, { spaces: 2 })
  }

  /**
   * Run `npm install` in the Project directory
   *
   * @param {Array} packages
   * @param {Object} opts
   * @returns
   */
  async npmInstall (packages = [], opts = {}) {
    opts = {
      ...{
        baseDir: ctx.cwd,
        stream: true,
        silent: true,
        quiet: false
      },
      ...opts
    }

    try {
      const flags = ['silent', 'quiet'].map((v) => { return opts[v] ? `--${v}` : '' }).join(' ')
      await this.runCommand(`cd ${opts.baseDir} && npm install ${flags}`, { stream: opts.stream })
      if (packages.length > 0) {
        packages.forEach(async (pkg) => {
          // packages installed here will NOT have the --save-dev flag
          await this.npmInstallPackage(pkg, opts)
        })
      }
      return true
    } catch (err) {
      this.logger.error('NPM INSTALL FAILED - PLEASE RUN MANUALLY')
      this.logger.error(err)
      return false
    }
  }

  /**
   * Install an NPM package
   * 
   * @param {String} pkg
   * @param {Object} opts
   * @returns
   */
  async npmInstallPackage (pkg, opts = {}) {
    opts = {
      ...{
        baseDir: ctx.cwd,
        stream: true,
        quiet: false,
        silent: true,
        saveDev: false
      },
      ...opts
    }

    try {
      let flags = ['silent', 'quiet'].map((v) => { return opts[v] ? `--${v}` : '' }).join(' ')
      flags += (opts.saveDev ? ' --save-dev' : ' --save')
      await this.runCommand(`cd ${opts.baseDir} && npm install ${pkg} ${flags}`, { stream: opts.stream })
      return true
    } catch (err) {
      this.logger.error(err)
      return false
    }
  }

  async npmPackageInfo (pkg, opts = {}) {
    opts = {
      ...{
        onError: 'return'
      },
      ...opts
    }
    let packageInfo = await this.runCommand(`npm view ${pkg} --json`, { stream: false })
    if (!packageInfo) {
      switch (opts.onError) {
        case 'return': return undefined
        case 'throw': throw new Error(`Package '${pkg}' is not a valid NPM Package`)
      }
    }
    if (typeof packageInfo === 'string') packageInfo = JSON.parse(packageInfo)
    return packageInfo
  }

  async addAppToProjectJson (update, opts) { return await this.addToProjectJson('app', update, opts) }
  async addPackageToProjectJson (update, opts) { return await this.addToProjectJson('package', update, opts) }
  async addServiceToProjectJson (update, opts) { return await this.addToProjectJson('service', update, opts) }

  async addToProjectJson (entity, update, opts = {}) {
    opts = { ...{}, ...opts }
    this.logger.debug(`Adding ${entity} to project.json`)
    const projectJson = await this.readProjectJson()
    switch (entity) {
      case 'app':
        if (!projectJson.apps) projectJson.apps = []
        projectJson.apps.push(update)
        break
      case 'package':
        if (!projectJson.packages) projectJson.packages = []
        projectJson.packages.push(update)
        break
      case 'service':
        if (!projectJson.services) projectJson.services = []
        projectJson.services.push(update)
        break
      default:
        throw new Error(`Can't add entity type '${entity}' to project.json`)
    }
    await this.writeProjectJson(projectJson)
    this.logger.debug(`Successfully added ${entity} to project.json`)
  }

  async removeAppFromProjectJson (id, opts) { return await this.removeFromProjectJson('app', id, opts) }
  async removePackageFromProjectJson (id, opts) { return await this.removeFromProjectJson('package', id, opts) }
  async removeServiceFromProjectJson (id, opts) { return await this.removeFromProjectJson('service', id, opts) }

  async removeFromProjectJson (entity, id, opts = {}) {
    opts = { ...{}, ...opts }
    this.logger.debug(`Removing ${id} from project.json`)
    const projectJson = await this.readProjectJson()
    switch (entity) {
      case 'app':
        projectJson.apps = projectJson.apps.filter(e => e.name !== id)
        break
      case 'package':
        projectJson.packages = projectJson.packages.filter(e => e.name !== id)
        break
      case 'service':
        projectJson.services = projectJson.services.filter(e => e.name !== id)
        break
      default:
        throw new Error(`Can't remove entity type '${entity}' from project.json`)
    }
    await this.writeProjectJson(projectJson)
    this.logger.debug(`Successfully removed ${id} from project.json`)
  }

  /**
   * Runs a command
   *
   * @param {String} cmd
   * @param {Object} opts
   * @returns
   */
  async runCommand (cmd, opts = {}) {
    opts = {
      ...{
        stream: false
      },
      ...opts
    }

    // ToDo: confirm apps aren't running

    const childProcess = require('child_process')
    const stdio = opts.stream ? 'inherit' : 'pipe'
    try {
      this.logger.debug(`RUN COMMAND: ${cmd}`)
      let response = childProcess.execSync(cmd, { stdio })
      if (response !== null && typeof response.toString === 'function') response = response.toString().trim()
      return response
    } catch (err) {
      console.log('ERROR')
      console.log(err)
    }
    return null
  }
}

module.exports = new PandaFactory()