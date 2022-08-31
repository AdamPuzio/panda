'use strict'

const Panda = require('../')
const Logger = require('./logger')
const Context = require('./context')
const PandaSingleton = require('./class/singleton')
const PandaCommand = require('./entity/command')
const path = require('path')
const util = require('./utility')
const chalk = require('chalk')
const semver = require('semver')
const glob = require('util').promisify(require('glob'))
const clargs = require('command-line-args')
const clusage = require('command-line-usage')
const _ = require('lodash')

/**
 * Terminal
 */
 class Terminal extends PandaSingleton {
  color = chalk
  fun = true

  /**
   * Terminal constructor
   *
   * @returns
   */
  constructor () {
    if (Terminal._instance) return Terminal._instance
    super()
    Terminal._instance = this

    Logger.setFormat('cli')
    this.Command = PandaCommand

    Logger.generateLoggerFns(this)
  }

  cmd (cmdDef) {
    return new PandaCommand(cmdDef)
  }

  /**
   * Validate the running version of Node meets the requirements
   * 
   * @param {String} version (optional) a version to check or empty to use the value in package.json
   */
  versionCheck (version) {
    const packageJson = require('../package.json')
    if (!version) version = packageJson.engines.node

    // Exit early if the user's node version is too low.
    if (!semver.satisfies(process.version, version)) {
      // Strip version range characters leaving the raw semantic version for output
      const rawVersion = version.replace(/[^\d\.]*/, '')
      const packageSite = packageJson.homepage
      console.log(`Panda CLI requires at least Node v${rawVersion}. You have ${process.version}.`)
      if (packageSite) console.log(`See ${packageSite} for details.`)
      process.exit(1)
    }
  }

  spacer () { console.log() }
  clear () { process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H') }
  out (msg, opts = {}) {
    opts = {
      ...{
        level: true,
        styles: null
      },
      ...opts
    }
    if (this.test(opts.level)) console.log(this.style(opts.styles)(msg))
  }
  test (level, levelAt) { return this.logger.test(...arguments) }

  exitError (err, msg) {
    if (msg) this.error(msg)

    if (this.test('debug')) console.log(err)
    else if (!msg) this.error(err)
    process.exit()
  }

  /**
   * Creates a simple group-based table
   * @param {*} data 
   * @param {*} opts 
   * @returns 
   */
  groupTable (data, opts={}) {
    opts = {
      ...{
        columns: {},
        groupBy: '',
        delimiter: '   '
      },
      ...opts
    }

    let cols = Object.keys(opts.columns)
    cols = cols.concat([opts.groupBy])

    const widths = Object.keys(opts.columns).map((col, index) => {
      return Math.max(...data.map(row => `${row[col]}`.length))
    })

    const output = {}
    
    _.chain(data)
    .groupBy(opts.groupBy)
    .map((v, k) => {
      return output[k] = _.map(v, (i) => _.pick(i, Object.keys(opts.columns))) 
    })
    .value()

    Object.keys(output).forEach((k) => {
      console.log(`${chalk.bold.blue('-- ' + _.startCase(k) + ' --')}`)
      const colh = Object.values(opts.columns).map((col, index) => {
        return `${col}`.padEnd(widths[index])
      }).join(opts.delimiter)
      console.log(chalk.dim.underline(colh))
      Object.values(output[k]).map(row => {
        const x =  Object.values(row).map((col, index) => `${col}`.padEnd(widths[index]))
          .join(opts.delimiter)
        console.log(x)
      })
      console.log()
    })
    return output
  }

  basicTable (arr, cfg={}) {
    cfg = {...{
      padding: 1,
      header: true,
      columnBorder: '  ',
      headerBorder: true,
      fieldList: null,
      action: 'print'
    }, ...cfg}

    const keys = cfg.fieldList || arr.reduce((arr, o) => {
      return Object.keys(o).reduce((a, k) => {
        if (a.indexOf(k) == -1) a.push(k)
        return a
      }, arr)
    }, [])
    const keyMap = {}
    keys.forEach(k => {
      const vals = arr.map(a => a[k])
      const maxLength = Math.max.apply(Math, vals.map(function (el) { return el ? el.length : 0 }))
      keyMap[k] = {
        full: maxLength,
        max: maxLength + cfg.padding
      }
    })
    const $underline = '\x1b[4m'
    const $bold = '\x1b[1m'
    const $reset = '\x1b[0m'
    
    const build = []
    if (cfg.header) {
      const row = []
      keys.forEach(k => {
        let col = ''.padStart(cfg.padding) + k.padEnd(keyMap[k].max)
        col = $bold + col + $reset
        if (cfg.headerBorder) col = $underline + col
        row.push(col)
      })
      build.push(row)
    }
    arr.forEach((i) => {
      const row = []
      keys.forEach(k => {
        const v = i[k] || ''
        row.push(''.padStart(cfg.padding) + v.padEnd(keyMap[k].max))
      })
      build.push(row)
    })

    let output = ''
    build.forEach(r => {
      output += r.join(cfg.columnBorder) + '\n'
    })

    switch (cfg.action) {
      case 'print': 
        console.log(output)
        break
      case 'return':
        return output
      case 'build':
        return build
    }
  }
}

module.exports = new Terminal()