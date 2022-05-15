'use strict'

const PandaEventEmitter = require('./class/event-emitter')
const Core = require('./core')
const Hub = require('./hub')
const Utility = require('./utility')
const path = require('path')
const chalk = require('chalk')
const prettyjson = require('prettyjson')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const { exit } = require('process')

/**
 * PandaFactory
 */
class PandaFactory extends PandaEventEmitter {
  /**
   * PandaFactory constructor
   * 
   * @returns 
   */
  constructor () {
    if (PandaFactory._instance) return PandaFactory._instance
    super()
    PandaFactory._instance = this

    this.scaffoldDir = path.join(path.dirname(__dirname), 'scaffold')
    this.projectDir = Core.projectDirectory()

    this.debug(`Panda.Factory initialized`)
  }

  /**
   * Parse a given command for info
   * 
   * @param {*} cmd 
   * @returns 
   */
  parse (cmd) {
    const options = {...{
      debug: false,
      fun: true,
      // allows you to override the scaffolding directory Panda looks in
      scaffoldDir: path.join(path.dirname(__dirname), 'scaffold'),
    }, ...cmd.opts()}

    cmd.logger.trace(prettyjson.render({ options, rawOptions: cmd.opts() }))
    this.setBaseCmd(cmd)

    this._parsedOpts = options
    return options
  }

  /**
   * Get the information on a specific scaffold 
   * 
   * @param {String} scaffold 
   * @returns 
   */
  async getScaffoldInfo (scaffold) {
    if (!scaffold.includes('/')) scaffold += '/' + scaffold
    const file = path.join(this._parsedOpts.scaffoldDir, scaffold + '.scaffold.js')
    const content = require(file)
    return content
  }

  /**
   * Check for any data requests that may be present and handle them accordingly
   * 
   * Potential Flags:
   *   --scaffold-list - list available scaffolds to choose from
   * 
   * @param {String} entity 
   * @param {Object} options 
   */
  async checkScaffoldDataRequest (entity, options) {
    // check for the --scaffold-list flag
    if (options.scaffoldList === true) {
      const scaffoldInfo = await this.getScaffoldInfo(entity)
      this.logger.infoMsg('Scaffold List: ')
      if (scaffoldInfo.data && Array.isArray(scaffoldInfo.data.scaffolds)) {
        scaffoldInfo.data.scaffolds.forEach((scaffold) => {
          this.logger.out(` ${scaffold.name}: ${scaffold.value}`)
        })
      } else { this.logger.warnMsg('No available scaffolds to report')}
      exit()
    }
  }

  /**
   * Run a specific scaffold prompt
   * 
   * @param {*} scaffold 
   * @param {*} options 
   * @returns 
   */
  async inquire (scaffold, options) {
    // if it's just one name, include the default
    const details = await this.getScaffoldInfo(scaffold)
    const answers = await inquirer.prompt(details.prompt)
    options = {...options, ...answers}
    return options
  }

  /**
   * Build something based on the provided scaffold and answers
   * 
   * @param {*} scaffold 
   * @param {*} options 
   * @returns 
   */
  async build (scaffold, options) {
    return new Promise(async (resolve, reject) => {
      this.logger.debug(`building a scaffolded item (${scaffold})`)
      const details = await this.getScaffoldInfo(scaffold)
      const build = await details.build(options, this)
      // if the script returns a function, run it; otherwise, assume everything has been run already
      if (typeof build === 'function') build(function () { resolve()  })
      else resolve()
    })
  }

  /**
   * Parses an options object and applies some additional key/value pairs
   * @param {Object} options 
   * @returns 
   */
  async _templateOptions (options) {
    if (options.slug) options.envslug = options.slug.toUpperCase().replace(/-/g, '_')
    return options
  }

  /**
   * Gets the contents of a template file and applies template data
   * 
   * @param {String} sourceFile 
   * @param {Object} options 
   * @returns 
   */
  async template (sourceFile, options) {
    const sourceFileContent = await Utility.getFile(sourceFile)
    const opts = await this._templateOptions(options)
    const content = await Utility.template(sourceFileContent, {data: opts})
    return content
  }

  /**
   * Generate a true path from a scaffold source path
   * @param {String} source 
   * @param {Object} opts 
   * @returns 
   */
  async generateSourcePath (source, opts={}) {
    let sourcePath = opts.scaffoldDir || this.scaffoldDir
    sourcePath = path.join(sourcePath, source)
    if (sourcePath.slice(sourcePath.length - 3) !== '.js') sourcePath += '.js'
    return sourcePath
  }

  /**
   * Copies a file or directory from source to dest
   * 
   * @param {String} source 
   * @param {String} dest 
   * @param {Object} opts 
   */
  async copy (source, dest, opts={}) {
    const sourceFile = path.join(opts.scaffoldDir || this.scaffoldDir, source)
    const destFile = path.join(opts.projectDir || this.projectDir || process.cwd(), dest)
    this.logger.debug(`attempting to copy from ${sourceFile} to ${destFile}`)

    await this.confirmNotExists(destFile, `Output location already exists, can't overwrite (${destFile})`)

    await fs.copy(sourceFile, destFile)
  }

  /**
   * Copies a template file to another location and applies the template data
   * @param {String} scaffold 
   * @param {String} dest 
   * @param {Object} opts 
   */
  async copyTemplate (scaffold, dest, opts={}) {
    const sourceFile = await this.generateSourcePath(scaffold, opts)
    const destFile = path.join(opts.projectDir || this.projectDir, dest)
    this.logger.debug(`attempting to copy from ${sourceFile} to ${destFile}`)

    await this.confirmNotExists(destFile, `Output location already exists, can't overwrite (${destFile})`)

    const sourceFileContent = await Utility.getFile(sourceFile)
    const tplOpts = await this._templateOptions(opts)
    let content = await Utility.template(sourceFileContent, {data: tplOpts})
    if (typeof opts.postProcess === 'function') content = await opts.postProcess(content, tplOpts)
    await fs.outputFile(destFile, content)
  }

  /**
   * Retrieves the latest version of an NPM package
   * 
   * @param {String} pkg 
   * @param {Object} opts 
   * @returns 
   */
  async latestPackage (pkg='panda', opts={}) {
    const childProcess = require('child_process')
    return childProcess.execSync(`npm show ${pkg} version`, {}).toString().trim()
  }

  /**
   * Runs a command
   * 
   * @param {String} cmd 
   * @param {Object} opts 
   * @returns 
   */
  async runCommand (cmd, opts={}) {
    opts = {...{
      stream: false
    }, ...opts}

    // ToDo: confirm apps aren't running

    const childProcess = require('child_process')
    const stdio = opts.stream ? 'inherit': 'pipe'
    try {
      this.logger.debug(`RUN COMMAND: ${cmd}`)
      let response = childProcess.execSync(cmd, { stdio: stdio })
      if (response !== null && typeof response.toString === 'function') response = response.toString().trim()
      return response
    } catch (err) {
      console.log('ERROR')
      console.log(err)
    }
    return null
  }

  /**
   * Build a package.json file in the Project directory
   * 
   * @param {String} projectDir 
   * @param {Object} options 
   */
  async buildPackageJson (projectDir, opts) {
    opts = {...{
      logEvents: true,
      debug: false,
      mode: 'cli'
    }, ...opts}

    const pandaVersion = await this.latestPackage()
    const pandaCfg = {}
    
    const pkgPath = path.join(projectDir, 'package.json')
    let pkg = {
      name: opts.slug,
      version: '1.0.0',
      description: '',
      main: 'index.js',
      scripts: {
        start: 'npx panda start'
      },
      panda: pandaCfg,
      keywords: [],
      author: '',
      license: '',
      dependencies: {
        panda: `^${pandaVersion}`
      },
      devDependencies: {},
      engines: {
        node: '>= 14.0.0'
      }
    }
    if (opts.testTool) pkg.scripts.test = opts.testTool
    if (opts.lintTool) pkg.scripts.lint = opts.lintTool
    if (opts.cssTool) pkg.scripts.compileCss = opts.cssTool
    if (opts.buildTool) pkg.scripts.build = opts.buildTool

    await fs.outputJSON(pkgPath, pkg, {
      spaces: 2
    })
    await this.npmInstall(projectDir, opts)
  }

  /**
   * Build a project.json file in the Project directory
   * 
   * @param {String} projectDir 
   * @param {Object} options 
   */
  async buildProjectJson (projectDir, opts) {
    opts = {...{}, ...opts}

    const pandaVersion = Core.getVersion()
    const pandaCfg = {}
    
    const pkgPath = path.join(projectDir, 'project.json')
    let pkg = {
      name: opts.name,
      slug: opts.slug,
      apps: {},
      services: {},
      packages: {}
    }
    await fs.outputJSON(pkgPath, pkg, {
      spaces: 2
    })
  }

  /**
   * Retrieves package.json in JSON format
   * @param {Object} opts 
   * @returns 
   */
  async readPackageJson (opts={}) {
    opts = {...{
      projectDir: this.projectDir
    }, ...opts}
    return require(path.join(opts.projectDir, 'package.json'))
  }

  /**
   * Writes to package.json
   * 
   * @param {Object} content 
   * @param {Object} opts 
   */
  async writePackageJson (content, opts={}){
    if (typeof content === 'string') content = JSON.parse(content)
    opts = {...{
      projectDir: this.projectDir
    }, ...opts}
    await fs.outputJSON(path.join(opts.projectDir, 'package.json'), content, {
      spaces: 2
    })
  }

  /**
   * Retrieves project.json in JSON format
   * 
   * @param {Object} opts 
   * @returns 
   */
  async readProjectJson (opts={}) {
    opts = {...{
      projectDir: this.projectDir
    }, ...opts}
    return require(path.join(opts.projectDir, 'project.json'))
  }

  /**
   * Writes to project.json
   * @param {String} content 
   * @param {Object} opts 
   */
  async writeProjectJson (content, opts={}){
    if (typeof content === 'string') content = JSON.parse(content)
    opts = {...{
      projectDir: this.projectDir
    }, ...opts}
    await fs.outputJSON(path.join(opts.projectDir, 'project.json'), content, {
      spaces: 2
    })
  }

  /**
   * Run `npm install` in the Project directory
   * 
   * @param {String} projectDir 
   * @param {Array} packages
   * @param {Object} opts 
   * @returns 
   */
  async npmInstall (projectDir, packages=[], opts={}) {
    opts = {...{
      projectDir: projectDir,
      stream: true,
      silent: true,
      quiet: false
    }, ...opts}

    try {
      const flags = ['silent', 'quiet'].map((v) => { return opts[v] ? `--${v}` : '' }).join(' ')
      const childProcess = require('child_process')
      await this.runCommand(`cd ${projectDir} && npm install ${flags}`, { stream: opts.stream })
      if (packages.length > 0) {
        packages.forEach(async (pkg) => {
          // packages installed here will NOT have the --save-dev flag
          await this.npmInstallPackage(pkg, opts)
        })
      }
      return true
    } catch (err) {
      this.logger.error(`NPM INSTALL FAILED - PLEASE RUN MANUALLY`)
      this.logger.error(err)
      return false
    }
  }

  /**
   * 
   * @param {String} pkg 
   * @param {String} projectDir 
   * @param {Boolean} saveDev 
   * @returns 
   */
  async npmInstallPackage (pkg, opts={}) {
    opts = {...{
      projectDir: this.projectDir,
      stream: true,
      quiet: false,
      silent: true,
      saveDev: false
    }, ...opts}

    try {
      const flag = opts.saveDev ? '--save-dev' : '--save'
      let flags = ['silent', 'quiet'].map((v) => { return opts[v] ? `--${v}` : '' }).join(' ')
      flags += (opts.saveDev ? ' --save-dev' : ' --save')
      await this.runCommand(`cd ${opts.projectDir} && npm install ${pkg} ${flags}`, { stream: opts.stream })
      return true
    } catch (err) {
      this.logger.error(err)
      return false
    }
  }

  async installPackage (pkg, opts={}) {
    opts = {...{
      projectDir: this.projectDir,
      stream: true,
      quiet: true,
      silent: false,
      saveDev: false
    }, ...opts}

    const pkgPath = path.join(opts.projectDir, 'package.json')

    // 
    this.logger.infoMsg(`Installing Package ${pkg}`)

    // fetch the package.json
    const beforePackage = require(pkgPath)

    if (!pkg) return this.logger.exitError('Please provide a package to install')
    const flags = ['silent', 'quiet'].map((v) => { return opts[v] ? `--${v}` : '' }).join(' ')
    await this.runCommand(`cd ${opts.projectDir} && npm install ${pkg} ${flags}`, { stream: opts.stream })


    // fetch the package.json... again
    delete require.cache[pkgPath]
    const afterPackage = require(pkgPath)

    const packageDiff = Object.entries(afterPackage.dependencies).reduce((c, [k, v]) => Object.assign(c, beforePackage.dependencies[k] ? {} : { [k]: v }), {})

    console.log({
      beforePackage,
      afterPackage,
      packageDiff
    })
  }

  async uninstallPackage (pkg, opts={}) {
    opts = {...{
      projectDir: this.projectDir,
      stream: true,
      quiet: true,
      silent: false
    }, ...opts}

    await this.confirmInProject()

    if (!pkg) return this.logger.exitError('Please provide a package to uninstall')
    const flags = ['silent', 'quiet'].map((v) => { return opts[v] ? `--${v}` : '' }).join(' ')
    return await this.runCommand(`npm uninstall ${pkg} ${flags}`, { stream: opts.stream })
  }

  /*
  * CHECKS
  */

  async throwError (err, opts={}) {
    opts = {...{
      onFail: 'exit'
    }, ...opts}
    switch (opts.onFail) {
      case 'exit':
        console.log(chalk.red.bold(err))
        exit()
        break;
      case 'throw':
        throw new Error(err)
        break;
      case 'return':
        return false
        break;
    }
    return
  }

  async projectDirCheck (cwd, errorOnFailure=true) {
    if (!cwd) cwd = process.cwd()
    let projectDir = Core.projectDirectory(cwd)
    if (!projectDir && errorOnFailure) throw new Error(`You need to be in a Project directory to perform this action`)
    if (!projectDir) projectDir = false
    return projectDir
  }

  async confirmInProject (opts={}) {
    opts = {...{
      cwd: process.cwd(),
      onFail: 'exit'
    }, ...opts}
    let projectDir = Core.projectDirectory(opts.cwd)
    if (!projectDir) {
      const msg = `You need to be in a Project directory to perform this action`
      this.throwError(msg, opts)
    }
    return true
  }

  async confirmNotInProject (opts={}) {
    opts = {...{
      cwd: process.cwd(),
      onFail: 'exit'
    }, ...opts}
    let projectDir = Core.projectDirectory(opts.cwd)
    if (projectDir) {
      const msg = `You can NOT be in a Project directory when performing this action`
      this.throwError(msg, opts)
    }
    return true
  }

  async confirmExists (file) {
    const fileExists = await Utility.pathExists(file)
    if (!fileExists) this.throwError(`FILE DOES NOT EXIST: ${file}`)
    /*if (!fileExists) {
      console.log(chalk.red.bold(`FILE DOES NOT EXIST: ${file}`))
      exit()
    }*/
  }

  async confirmNotExists (file, msg) {
    const fileExists = await Utility.pathExists(file)
    if (fileExists) this.throwError(`FILE ALREADY EXISTS: ${file}`)
    /*if (fileExists) {
      console.log(chalk.red.bold(msg || `FILE ALREADY EXISTS: ${file}`))
      exit()
    }*/
  }

  /*
  * GULP CONVENIENCE FUNCTIONS
  */

  /**
   * Convenience Gulp function to compile as an EJS template
   * @param {Object} data 
   * @param {Object} options 
   * @returns 
   */
  compile (data, options = {}) {
    return through.obj(function(file, encoding, cb) {
      if (file.isBuffer()) {
        const ejsData = Object.assign({}, {data: data}, file.data)
        const code = Utility.templateSync(file.contents.toString(), ejsData, options)
        file.contents = Buffer.from(code)
      }
      cb(null, file)
    })
  }

  /**
   * Convenience Gulp function to rename files
   * 
   * @param {Object} obj 
   * @param {Object} options 
   * @returns 
   */
  rename (obj, options) {
    options = options || {}
    var Stream = require('stream')
    var Path = require('path')
  
    var stream = new Stream.Transform({ objectMode: true })
  
    function parsePath(path) {
      var extname = options.multiExt
        ? Path.basename(path).slice(Path.basename(path).indexOf('.'))
        : Path.extname(path);
      return {
        dirname: Path.dirname(path),
        basename: Path.basename(path, extname),
        extname: extname
      };
    }
  
    stream._transform = function(originalFile, unused, callback) {
      var file = originalFile.clone({ contents: false })
      var parsedPath = parsePath(file.relative)
      var path;
  
      var type = typeof obj;
  
      if (type === 'string' && obj !== '') {
        path = obj
      } else if (type === 'function') {
        let newParsedPath = obj(parsedPath, file)
        if (typeof newParsedPath === 'object' && newParsedPath !== null) {
          parsedPath = newParsedPath
        }
  
        path = Path.join(
          parsedPath.dirname,
          parsedPath.basename + parsedPath.extname
        );
      } else if (type === 'object' && obj !== undefined && obj !== null) {
        var dirname = 'dirname' in obj ? obj.dirname : parsedPath.dirname,
          prefix = obj.prefix || '',
          suffix = obj.suffix || '',
          basename = 'basename' in obj ? obj.basename : parsedPath.basename,
          extname = 'extname' in obj ? obj.extname : parsedPath.extname
  
        path = Path.join(dirname, prefix + basename + suffix + extname)
      } else {
        callback(
          new Error('Unsupported renaming parameter type supplied'),
          undefined
        );
        return
      }
  
      file.path = Path.join(file.base, path)
  
      // Rename sourcemap if present
      if (file.sourceMap) {
        file.sourceMap.file = file.relative
      }
  
      callback(null, file)
    };
  
    return stream
  }

  /*
  * ADDITIONAL METHODS
  */

  /**
   * Update the local logger and cmd
   * 
   * @param {*} cmd 
   */
  setBaseCmd (cmd) {
    this.cmd = cmd
    this.logger = cmd.logger
  }
}

module.exports = new PandaFactory()
