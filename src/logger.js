'use strict'

const Utility = require('./utility')
const Hub = require('./hub')
const winston = require('winston')
const { combine, splat, timestamp, label, printf } = winston.format
const chalk = require('chalk')
const prettyjson = require('prettyjson')
const path = require('path')
const _ = require('lodash')

const levels = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
const levelColors = { fatal: 'redBright', error: 'red', warn: 'yellow', info: 'green', verbose: '', debug: '', silly: 'dim', success: 'blue' }

const optlib = {}
optlib.format = {
  simple: winston.format.simple(),
  json: winston.format.json(),
  panda: winston.format.printf((info) => {
    const lvl = info[Symbol.for('level')]
    let msg = [
      chalk.dim(info.timestamp),
      (levelColors[lvl] ? chalk[levelColors[lvl]](lvl.toUpperCase().padEnd(8)) : lvl.toUpperCase().padEnd(8)),
      chalk.cyan(info.label),
      info.message
    ].join(' ')
    if (info.metadata) msg += JSON.stringify(info.metadata)
    return msg
  }),
  basic: printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`
  }),
  cli: winston.format.printf((info) => {
    const lvl = info[Symbol.for('level')]
    return (levelColors[lvl] ? chalk[levelColors[lvl]](info.message) : info.message)
  })
}

/**
 * PandaLogger
 */
class PandaLogger {
  /**
   * PandaLogger constructor
   * 
   * @param {String} name 
   * @param {Object} options 
   */
  constructor(name, options={}) {
    this._name = name
    this.generateSettings(options)
    const logger = this._logger = winston.createLogger(this._settings)
    this._logger = logger
  }

  _settingsObj = null

  _levels = levels

  _levelColors = levelColors

  generateSettings (options={}) {
    if (!this._settingsObj) {
      const env = Utility.parseEnv()
      this._settingsObj = {
        default: {
          level: 'info',
          levels: levels,
          format: 'panda',
          transports: [
            new winston.transports.Console()
          ]
        },
        options: [],
        env,
        parsed: null
      }
      this._settingsObj.options.push(options)
    }
    const sobj = this._settingsObj
    const reduce = sobj.options.reduce((obj, item) => { return item }, {})
    const parsed = this.parseOptions({...sobj.default, ...reduce, ...sobj.env})
    this._settings = this._settingsObj.parsed = parsed
  }

  configure (opts={}) {
    if (Object.keys(opts).length === 0) return
    this.generateSettings(opts)
    this._settings.transports.forEach((transport) => {
      transport.level = this._settings.level
    })

    this._logger = winston.createLogger(this._settings)
  }

  parseOptions (options={}) {
    // level - default level
    // levels - object of levels to override the system defaults
    // format - the output format
    let opts = Object.assign({}, options)
    if (opts.format) {
      switch (typeof opts.format) {
        case 'string':
          let format
          if (optlib.format[opts.format]) format = optlib.format[opts.format]
          else format = printf(({ level, message, label, timestamp }) => {
            return opts.format
          })
          opts.format = combine(
            label({ label: this._name, message: false }),
            splat(),
            timestamp(),
            format
          )
          break;
        case 'object':
        default:
          // do nothing, let this one pass through
      }
      return opts
    }
    // transports - a list of transports
    // exitOnError
    // silent
    return opts
  }

  levelTest (level, levelAt) {
    const levels = this._settings.levels
    if (!levelAt) levelAt = this._level
    return levels.indexOf(level) <= levels.indexOf(levelAt)
  }

  fatal (...args) { return this._logger.error(...args) }
  error (...args) { return this._logger.error(...args) }
  warn (...args) { return this._logger.warn(...args) }
  info (...args) { return this._logger.info(...args) }
  verbose (...args) { return this._logger.verbose(...args) }
  debug (...args) { return this._logger.debug(...args) }
  silly (...args) { return this._logger.silly(...args) }
  trace (...args) { return this._logger.log('silly', ...args) }

  out (msg, styles) { return console.log(this._style(styles)(msg)) }
  sillyMsg (msg) { return this.levelTest('silly') ? this.out(msg, this._levelColors['silly']) : null }
  traceMsg (msg) { return this.out(msg, this._levelColors['silly']) }
  debugMsg (msg) { return this.out(msg, this._levelColors['debug']) }
  infoMsg (msg) { return this.out(msg, this._levelColors['info']) }
  warnMsg (msg) { return this.out(msg, this._levelColors['warn']) }
  errorMsg (msg) { return this.out(msg, this._levelColors['error']) }
  fatalMsg (msg) { return this.out(msg, this._levelColors['fatal']) }
  successMsg (msg) { return this.out(msg, this._levelColors['success']) }

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

module.exports = PandaLogger