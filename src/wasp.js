'use strict'

const Commander = require('commander')
const Factory = require('./factory')
const chalk = require('chalk')
const prettyjson = require('prettyjson')
const path = require('path')
const { relativeTimeThreshold } = require('moment')
const { exit } = require('process')

class PandaCommand extends Commander.Command {
  constructor(name) {
    super()
  }
}

class CliLogger {
  constructor(name, options={}) {
    this._name = name
    let settings = {...{
      debug: false,
      noFun: false,
      level: 'info',
      levels: ['fatal', 'error', 'warn', 'info', 'debug', 'trace']
    }, ...options}
    // if the 'debug' flag was set to true, make that the level
    if (settings.debug === true) settings.level = 'debug'
    // if 'debug' is a string, that means a specific level was requested
    if (typeof settings.debug === 'string') settings.level = settings.debug
    this._levels = settings.levels
    this._level = settings.level
    this._settings = settings
    if (this.levelTest('debug', this.level)) this.out(`--- Debug Mode: ON, Level: ${settings.level} ---`, 'magenta')
  }

  log (level, message, style) {
    const levels = this._settings.levels
    const levelAt = this._settings.level
    if (this.levelTest(level)) {
      if (style) this.out(message, style)
      else console.log(message)
    }
  }

  _levelColors = {
    trace: 'dim',
    debug: '',
    info: 'green',
    warn: 'yellow',
    error: 'red',
    fatal: 'redBright',
    success: 'blue'
  }

  levelTest (level, levelAt) {
    const levels = this._settings.levels
    if (!levelAt) levelAt = this._level
    return levels.indexOf(level) <= levels.indexOf(levelAt)
  }

  trace(msg, style) { this.log('trace', msg, style) }
  debug(msg, style) { this.log('debug', msg, style) }
  info(msg, style) { this.log('info', msg, style) }
  warn(msg, style) { this.log('warn', msg, style) }
  error(msg, style) { this.log('error', msg, style) }
  fatal(msg, style) { this.log('fatal', msg, style) }

  out (msg, styles) { return console.log(this._style(styles)(msg)) }
  traceMsg (msg) { return this.out(msg, this._levelColors['trace']) }
  debugMsg (msg) { return this.out(msg, this._levelColors['debug']) }
  infoMsg (msg) { return this.out(msg, this._levelColors['info']) }
  warnMsg (msg) { return this.out(msg, this._levelColors['warn']) }
  errorMsg (msg) { return this.out(msg, this._levelColors['error']) }
  fatalMsg (msg) { return this.out(msg, this._levelColors['fatal']) }
  successMsg (msg) { return this.out(msg, this._levelColors['success']) }

  exception (err, msg) {
    if (this.levelTest('debug')) console.log(err)
    if (this._settings.cmd) this._settings.cmd.error(msg)
  }

  exitError (msg) {
    this.fatalMsg(msg)
    exit()
  }

  _style (styles) {
    let call = chalk
    if (styles) {
      if (typeof styles === 'string') styles = styles.split('.')
      styles.forEach((style) => {
        if (chalk[style]) call = call[style]
      })
    }
    return call
  }

  prettyjson(val) {
    let prettyjsonCfg = {}
    if (new Date().getMonth() === 5 && this._settings.fun === true) prettyjsonCfg.keysColor = 'rainbow'
    return prettyjson.render(val, prettyjsonCfg)
  }
}

class Wasp {
  constructor() {
    if (Wasp._instance) return Wasp._instance
    
    Wasp._instance = this

    // let's set up some convenience classes/methods
    this.Commander = Commander
    this.Command = PandaCommand
    this.Option = Commander.Option
    this.Logger = CliLogger
  }

  parse (cmd) {
    let options = {...{
      debug: false,
      fun: true,
      // allows you to override the scaffolding directory Panda looks in
      scaffoldDir: path.join(path.dirname(__dirname), 'scaffold'),
    }, ...cmd.opts()}

    const logger = new CliLogger('PandaCLI', {
      debug: options.debug,
      cmd: cmd,
      fun: options.fun
    })

    logger.trace(prettyjson.render({ options, rawOptions: cmd.opts() }))
    Factory.setLogger(logger)

    return {
      logger,
      options
    }
  }
}

module.exports = new Wasp()