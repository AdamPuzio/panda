'use strict'

const Panda = require('../../')
const Utility = require('../utility')
const Factory = require('../factory')
const Logger = require('../logger')
const Context = require('../context')
const ctx = Context.ctx
const helpers = require('../etc/helpers/scaffold-helpers')
const path = require('path')
const fs = require('fs-extra')
const ejs = require('ejs')
const chalk = require('chalk')
const _ = require('lodash')
const stackTrace = require('stack-trace')

class PandaScaffold {
  constructor (scaffoldObj) {
    this.logger = Logger.getLogger('Scaffold')
    this._file = stackTrace.get()[1].getFileName()

    this.pandaDir = Panda.ctx.PANDA_PATH

    this.map(scaffoldObj)
  }

  Factory = Factory
  static helpers = helpers

  //namespace = null
  name = ''
  description = ''
  interface = []

  map (scaffoldObj) {
    const map = ['name', 'description', 'interface', 'build']
    Utility.methodMap(scaffoldObj, this, map)
  }

  data () {
    return {
      //file: this._file,
      //namespace: this.namespace,
      name: this.name,
      description: this.description
    }
  }

  //async parse (options) {}

  async build (data, opts = {}) {
    throw new Error(`No build instructions provided`)
  }

  async _build (data, opts = {}) {
    // let's try to work with both sync and async
    const fn = this._build
    if (fn.constructor.name === 'AsyncFunction' || fn[Symbol.toStringTag] === 'AsyncFunction') {
      return await fn.call(this, data, opts)
    }
    return fn.call(this, data, opts)
  }

  /**
   * Copies a file or directory from source to dest
   *
   * @param {String} source
   * @param {String} dest
   * @param {Object} opts
   */
  async copy (source, dest, opts = {}) {
    opts = {
      ...{
        destBase: ctx.cwd
      },
      ...opts
    }
    const destFile = path.join(opts.destBase, dest)
    this.logger.debug(`attempting to copy from ${source} to ${destFile}`)

    await this.confirmNotExists(destFile, `Output location already exists, can't overwrite (${destFile})`)

    await fs.copy(source, destFile)
  }

  /**
   * Gets the contents of a template file and applies template data
   *
   * @param {String} sourceFile
   * @param {Object} options
   * @returns
   */
  async template (sourceFile, data, opts = {}) {
    opts = {
      ...{
        save: false
      },
      ...opts
    }
    const sourceFileContent = await this.getFile(sourceFile)
    data = await this._templateData(data)
    const content = await this._template(sourceFileContent, { data })
    if (opts.save) await this.setFile(sourceFile, content)
    return content
  }

  /**
   * Copies a template file to another location and applies the template data
   * 
   * @param {String} scaffold
   * @param {String} dest       Destination path (relative to cwd)
   * @param {Object} opts
   */
  async copyTemplate (source, dest, data = {}, opts = {}) {
    opts = {
      ...{
        destBase: ctx.cwd
      },
      ...opts
    }

    const destFile = path.join(opts.destBase, dest)

    this.logger.debug(`attempting to copy from ${source} to ${destFile}`)

    await this.confirmNotExists(destFile, `Output location already exists, can't overwrite (${destFile})`)

    const sourceFileContent = await this.getFile(source)
    const tplData = await this._templateData(data)
    let content = await this._template(sourceFileContent, { data: tplData, Utility, _: Utility._ })
    if (typeof opts.postProcess === 'function') content = await opts.postProcess(content, opts)
    return await fs.outputFile(destFile, content)
  }

  async rename (source, dest, opts = {}) {
    opts = {
      ...{
        destBase: ctx.cwd
      },
      ...opts
    }
    const sourceFile = path.join(opts.destBase, source)
    const destFile = path.join(opts.destBase, dest)
    return await fs.rename(sourceFile, destFile)
  }

  /**
   * Parses a data object and applies some additional context key/value pairs
   * @param {Object} options
   * @returns
   */
  async _templateData (data) {
    if (data.slug) data.envslug = data.slug.toUpperCase().replace(/-/g, '_')
    if (data.entity) data.entityPretty = _.startCase(data.entity)
    return data
  }

  async throwError (err, opts = {}) {
    opts = {
      ...{
        onFail: 'exit'
      },
      ...opts
    }
    switch (opts.onFail) {
      case 'exit':
        console.log(chalk.red.bold(err))
        process.exit()
        break
      case 'throw':
        throw new Error(err)
      case 'return':
        return false
    }
  }

  async confirmExists (file, msg) {
    const fileExists = await this.pathExists(file)
    if (!fileExists) this.throwError(`FILE DOES NOT EXIST: ${file}`)
  }

  async confirmNotExists (file) {
    const fileExists = await this.pathExists(file)
    if (fileExists) this.throwError(`FILE ALREADY EXISTS: ${file}`)
  }

  async pathExists (p) { return await fs.pathExists(p) }
  async getFile (filePath, type = 'utf8') { return await fs.readFile(filePath, type) }
  async setFile (filePath, content, opts = {}) { return await fs.writeFile(filePath, content, opts) }
  async chmod (file, perms = 0o755) { return fs.chmodSync(file, perms) }
  async _template (tpl, dataObj) { return ejs.render(tpl, dataObj) }
}

module.exports = PandaScaffold
