'use strict'

const Panda = require('../')
const Core = require('../src/core')
const Utility = require('../src/util')
const Config = require('./cfg').getConfig()
const path = require('path')
const inquirer = require('inquirer')
const chalk = require('chalk')
const fs = require('fs-extra')
const { exit } = require('process')
const PandaConfig = require('./cfg')

let logger = require('./log').getLogger('FACTORY')

/**
 * PandaFactory class
 *
 * @class PandaFactory
 */
class PandaFactory {
  /**
   * Creates an instance of PandaFactory
   */
  constructor() {
    if (PandaFactory._instance) return PandaFactory._instance

    PandaFactory._instance = this

    this.scaffoldDir = path.join(path.dirname(__dirname), 'scaffold')
    this.projectDir = Core.determineProjectDirectory()
  }

  /**
   * Get the information on a specific scaffold 
   * 
   * @param {String} scaffold 
   * @returns 
   */
  async getScaffoldInfo (scaffold) {
    if (!scaffold.includes('/')) scaffold += '/' + scaffold
    const file = path.join(this.scaffoldDir, scaffold + '.scaffold.js')
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
      logger.infoMsg('Scaffold List: ')
      if (scaffoldInfo.data && Array.isArray(scaffoldInfo.data.scaffolds)) {
        scaffoldInfo.data.scaffolds.forEach((scaffold) => {
          logger.out(` ${scaffold.name}: ${scaffold.value}`)
        })
      } else { logger.warnMsg('No available scaffolds to report')}
      exit()
    }
  }

  async inquire (scaffold, options) {
    // if it's just one name, include the default
    const details = await this.getScaffoldInfo(scaffold)
    const answers = await inquirer.prompt(details.prompt)
    options = {...options, ...answers}
    return options
  }

  async build (scaffold, options) {
    return new Promise(async (resolve, reject) => {
      logger.debug(`building a scaffolded item (${scaffold})`)
      const details = await this.getScaffoldInfo(scaffold)
      const build = await details.build(options, this)
      // if the script return a function, run it; otherwise, assume everything has been run already
      if (typeof build === 'function') build(function () { resolve()  })
      else resolve()
    })
  }

  async _templateOptions (options) {
    if (options.slug) options.envslug = options.slug.toUpperCase().replace(/-/g, '_')
    return options
  }

  async template (sourceFile, options) {
    const sourceFileContent = await Utility.getFile(sourceFile)
    const opts = await this._templateOptions(options)
    const content = await Utility.template(sourceFileContent, {data: opts})
    return content
  }

  async generateSourcePath (source, options={}) {
    let sourcePath = options.scaffoldDir || this.scaffoldDir
    sourcePath = path.join(sourcePath, source)
    if (sourcePath.slice(sourcePath.length - 3) !== '.js') sourcePath += '.js'
    return sourcePath
  }

  async copy (source, dest, options={}) {
    const sourceFile = path.join(options.scaffoldDir || this.scaffoldDir, source)
    const destFile = path.join(options.projectDir || this.projectDir || process.cwd(), dest)
    logger.debug(`attempting to copy from ${sourceFile} to ${destFile}`)

    await this.confirmNotExists(destFile, `Output location already exists, can't overwrite (${destFile})`)

    await fs.copy(sourceFile, destFile)
  }

  async copyTemplate (scaffold, dest, options={}) {
    //const sourceFile = path.join(options.scaffoldDir || this.scaffoldDir, scaffold)
    const sourceFile = await this.generateSourcePath(scaffold, options)
    const destFile = path.join(options.projectDir || this.projectDir, dest)
    logger.debug(`attempting to copy from ${sourceFile} to ${destFile}`)

    await this.confirmNotExists(destFile, `Output location already exists, can't overwrite (${destFile})`)

    const sourceFileContent = await Utility.getFile(sourceFile)
    const opts = await this._templateOptions(options)
    const content = await Utility.template(sourceFileContent, {data: opts})
    await fs.outputFile(destFile, content)
  }

  /**
   * Build a package.json file in the Project directory
   * 
   * @param {String} projectDir 
   * @param {Object} options 
   */
  async buildPackageJson (projectDir, options) {
    options = {...{
      //testSuite: 'jest',
      logEvents: true,
      debug: false,
      mode: 'cli'
    }, ...options}

    const pandaVersion = Core.getVersion()
    const pandaCfg = {}
    
    const pkgPath = path.join(projectDir, 'package.json')
    let pkg = {
      name: options.slug,
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
    if (options.testTool) pkg.scripts.test = options.testTool
    if (options.lintTool) pkg.scripts.lint = options.lintTool
    if (options.cssTool) pkg.scripts.compileCss = options.cssTool
    if (options.buildTool) pkg.scripts.build = options.buildTool

    await fs.outputJSON(pkgPath, pkg, {
      spaces: 2
    })
    await this.npmInstall(projectDir, options)
  }

  /**
   * Build a project.json file in the Project directory
   * 
   * @param {String} projectDir 
   * @param {Object} options 
   */
  async buildProjectJson (projectDir, options) {
    options = {...{}, ...options}

    const pandaVersion = Core.getVersion()
    const pandaCfg = {}
    
    const pkgPath = path.join(projectDir, 'project.json')
    let pkg = {
      name: options.name,
      slug: options.slug,
      packages: {}
    }
    await fs.outputJSON(pkgPath, pkg, {
      spaces: 2
    })
  }

  /**
   * Run `npm install` in the Project directory
   * 
   * @param {String} projectDir 
   * @param {Array} packages
   * @param {Object} options 
   * @returns 
   */
  async npmInstall (projectDir, packages=[], options) {
    try {
      const childProcess = require('child_process')
      childProcess.execSync(`cd ${projectDir} && npm install --silent`, { stdio: [0, 1, 2] })
      if (packages.length > 0) {
        packages.forEach(async (pkg) => {
          // packages installed here will NOT have the --save-dev flag
          await this.npmInstallPackage(pkg, projectDir)
        })
      }
      return true
    } catch (err) {
      logger.error(err)
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
  async npmInstallPackage (pkg, projectDir, saveDev=false) {
    try {
      let flag = saveDev ? '--save-dev' : '--save'
      const childProcess = require('child_process')
      childProcess.execSync(`cd ${projectDir} && npm install ${pkg} --silent ${flag}`, { stdio: [0, 1, 2] })
      return true
    } catch (err) {
      logger.error(err)
      return false
    }
  }

  async installPackage (pkg, opts={}) {
    const projectDir = opts.projectDir || this.projectDir
    const pkgPath = path.join(projectDir, 'package.json')

    // 
    logger.infoMsg(`Installing Package ${pkg}`)

    // fetch the package.json
    const beforePackage = require(pkgPath)

    if (!pkg) return logger.exitError('Please provide a package to install')
    const childProcess = require('child_process')
    childProcess.execSync(`npm install ${pkg}`, { stdio: [0, 1, 2] })


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
      silentMode: false
    }, ...opts}

    if (!pkg) return logger.exitError('Please provide a package to uninstall')
    const childProcess = require('child_process')
    const params = opts.silentMode ? {} : { stdio: [0, 1, 2] }
    childProcess.execSync(`npm uninstall ${pkg}`, params).toString().trim()
    /*if (opts.silentMode) {
      childProcess.execSync(`npm uninstall ${pkg}`).toString().trim()
    } else {
      childProcess.execSync(`npm uninstall ${pkg}`, { stdio: [0, 1, 2] })
    }*/
    
  }

  /*
  * CHECKS
  */

  async projectDirCheck (cwd, errorOnFailure=true) {
    if (!cwd) cwd = process.cwd()
    let projectDir = Core.determineProjectDirectory(cwd)
    if (!projectDir && errorOnFailure) throw new Error(`You need to be in a Project directory to perform this action`)
    if (!projectDir) projectDir = false
    return projectDir
  }

  async confirmInProject (opts={}) {
    opts = {...{
      cwd: process.cwd(),
      onFail: 'exit'
    }, ...opts}
    let projectDir = Core.determineProjectDirectory(opts.cwd)
    if (!projectDir) {
      const msg = `You need to be in a Project directory to perform this action`
      switch (opts.onFail) {
        case 'exit':
          console.log(chalk.red.bold(msg))
          exit()
          break;
        case 'throw':
          throw new Error(msg)
          break;
        case 'return':
          return false
          break;
      }
      return true
    }
  }

  async confirmNotInProject (opts={}) {
    opts = {...{
      cwd: process.cwd(),
      onFail: 'exit'
    }, ...opts}
    let projectDir = Core.determineProjectDirectory(opts.cwd)
    if (projectDir) {
      const msg = `You can NOT be in a Project directory when performing this action`
      switch (opts.onFail) {
        case 'exit':
          console.log(chalk.red.bold(msg))
          exit()
          break;
        case 'throw':
          throw new Error(msg)
          break;
        case 'return':
          return false
          break;
      }
      return true
    }
  }

  async checkExists (file) {
    return await Utility.fileExists(file)
  }

  async confirmExists (file) {
    const fileExists = await Utility.fileExists(file)
    //if (!fileExists) throw new Error(`File ${file} does not exist`)
    if (!fileExists) {
      console.log(chalk.red.bold(`FILE DOES NOT EXIST: ${file}`))
      exit()
    }
  }

  async confirmNotExists (file, msg) {
    const fileExists = await Utility.fileExists(file)
    //if (fileExists) throw new Error(`File ${file} already exists`)
    if (fileExists) {
      console.log(chalk.red.bold(msg || `FILE ALREADY EXISTS: ${file}`))
      exit()
    }
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
   * Update the logger used
   * 
   * @param {*} log 
   */
  setLogger (log) { logger = log }
}

const Factory = new PandaFactory()

module.exports = Factory
