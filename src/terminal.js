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
}

module.exports = new Terminal()