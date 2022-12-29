'use strict'

const winston = require('winston')
const { combine, splat, timestamp, label, printf } = winston.format
const EventEmitter = require('events')
const chalk = require('chalk')
const symbols = require('figures')
const Utility = require('./utility')
const Context = require('./context')

const levelInfo = {
  fatal: { lvl: 0, color: 'redBright', symbol: 'cross' },
  error: { lvl: 1, color: 'red', symbol: 'cross' },
  warn: { lvl: 2, color: 'yellow', symbol: 'warning' },
  http: { lvl: 3, color: 'yellow', symbol: 'warning' },
  info: { lvl: 4, color: 'green', symbol: 'info' },
  verbose: { lvl: 5, symbol: 'pointerSmall' },
  debug: { lvl: 6, symbol: 'dot' },
  silly: { lvl: 7, symbol: 'dot', color: 'dim' },
  success: { level: 'info', color: 'green', symbol: 'tick' }
}
const levels = Object.fromEntries(Object.entries(levelInfo).filter(([k, v]) => { return Number.isInteger(v.lvl) }).map(([k, v]) => { return [k, v.lvl] }))
const levelColors = Object.fromEntries(Object.entries(levelInfo).map(([k, v]) => { return [k, (v.color || '')] }))

const optlib = {}
optlib.format = {
  simple: winston.format.simple(),
  json: winston.format.json(),
  basic: printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`
  }),
  standard: winston.format.printf((info) => {
    const lvl = info[Symbol.for('level')]
    let msg = [
      chalk.dim(info.timestamp),
      (levelColors[lvl] ? chalk[levelColors[lvl]](lvl.toUpperCase().padEnd(8)) : lvl.toUpperCase().padEnd(8)),
      chalk.cyan(info.label).padEnd(20),
      info.message
    ].join(' ')
    if (info.metadata) msg += JSON.stringify(info.metadata)
    return msg
  }),
  cli: winston.format.printf((info) => {
    const lvl = info.subtype || info[Symbol.for('level')]
    const style = levelInfo[lvl]
    if (!style.symbol) return info.message
    let sym = symbols[style.symbol]
    if (style.color) sym = chalk[style.color](sym)
    return `${sym} ${info.message}`
  })
}

const settings = {
  level: 'info',
  format: 'standard',
  formatLock: false,
  customLevel: {}
}

/**
 * PandaLogger
 */
class PandaLogger extends EventEmitter {
  levelInfo = levelInfo
  levels = levels
  levelColors = levelColors
  colors = chalk

  /**
   * PandaLogger constructor
   */
  constructor () {
    if (PandaLogger._instance) return PandaLogger._instance
    super()
    PandaLogger._instance = this

    this._getBaseVals()
    this._createBaseLogger()

    this.on('format:update', format => {
      Object.keys(this._cache).forEach(e => {
        this._cache[e]._build({format})
      })
    })
  }

  _cache = {}

  /**
   * Retrieve or create a new logger instance
   * 
   * @param {String} name the name of the logger
   * @param {Object} opts configuration
   * @returns {PandaLoggerInstance} logger instance
   */
  getLogger (name, opts = {}) {
    if (!name) name = '--base--'
    if (this._cache[name]) return this._cache[name]
    const cache = this._cache[name] = new PandaLoggerInstance(name, opts, this)
    return cache
  }

  /**
   * Set the format for all loggers
   * 
   * @param {String} format 
   * @returns 
   */
  setFormat (format) {
    if (settings.formatLock === true) return
    settings.format = format
    this.emit('format:update', format)
  }

  /**
   * Get a list of format types
   * 
   * @returns {Array} list of format types
   */
  getFormats () {
    return Object.keys(optlib.format)
  }

  /**
   * Get a list of logging levels
   * 
   * @returns {Array} list of levels
   */
  getLevels () {
    return Object.keys(levelInfo)
  }

  /**
   * Determine the base configuration values for level and format
   */
  _getBaseVals () {
    const opts = Utility.parseOptions([
      { name: 'debug', alias: 'd', defaultValue: false },
      { name: 'debug-silly', defaultValue: false },
      { name: 'log-level', type: String },
      { name: 'log-format', type: String },
      { name: 'no-fun', type: Boolean, defaultValue: false }
    ])

    // apply environmental values
    if (process.env.LOG_LEVEL) settings.logLevel = process.env.LOG_LEVEL
    if (process.env.LOG_FORMAT) settings.logLevel = process.env.LOG_FORMAT
    
    if (opts.logLevel && typeof opts.logLevel === 'string') settings.level = opts.logLevel
    if (opts.logFormat && typeof opts.logFormat === 'string') {
      settings.format = opts.logFormat
      settings.formatLock = true
    }
    
    if (opts.debug !== false) {
      if (opts.debug === true || opts.debug === null || opts.debug === 'all') {
        settings.level = 'debug'
      } else if (typeof opts.debug === 'string') {
        const list = opts.debug.split(',')
        list.forEach(i => {
          settings.customLevel[i] = 'debug'
        })
      }
    }
    if (opts.debugSilly !== false) {
      if (opts.debugSilly === true || opts.debugSilly === null || opts.debugSilly === 'all') {
        settings.level = 'silly'
      } else if (typeof opts.debugSilly === 'string') {
        const list = opts.debugSilly.split(',')
        list.forEach(i => {
          settings.customLevel[i] = 'silly'
        })
      }
    }
  }

  _createBaseLogger () {
    if (this._cache['--base--']) return this._cache['--base--']

    const cache = this._cache['--base--'] = new PandaLoggerInstance('Core', {}, this)
    this.baseLogger = cache
    return cache
  }

  debug (msg) {
    this.baseLogger.debug(msg)
  }

  generateLoggerFns (scope) {
    Object.entries(levelInfo).forEach(([k, v]) => {
      scope[k] = function (msg) {
        scope.logger.log({
          level: v.level || k,
          message: msg,
          subtype: k
        })
      }
    })
  }
}

/**
 * PandaLoggerInstance
 */
class PandaLoggerInstance {
  levelInfo = levelInfo
  levels = levels
  levelColors = levelColors

  _level = null
  _format = null

  constructor (name, opts = {}, Logger) {
    this.name = name
    this.Logger = Logger
    this._build(opts)

    this._generateLoggerFns()
    
    this.Logger.on('format:update', (format) => {
      this._format = format
      this._build({ format })
    })
  }

  _build (opts = {}) {
    const cfg = this.generateConfig(this.name, opts)
    this._logger = winston.createLogger(cfg)
    return this._logger
  }

  generateConfig (name, opts = {}) {
    this._rawConfig = opts
    opts = this.getBaseSettings(name, opts)
    this.level = opts.level
    this.format = opts.format
    // let format = process.env.LOG_FORMAT || opts.format || this.format
    const _format = this._format = opts.format
    if (typeof this.format === 'string') this.format = optlib.format[this.format]
    const cfg = {
      level: opts.level,
      levels,
      _format,
      format: combine(
        label({ label: name, message: false }),
        splat(),
        timestamp(),
        this.format
      ),
      transports: opts.transports || [
        new winston.transports.Console()
      ]
    }
    this._config = cfg
    return cfg
  }

  /**
   * Apply values for level and format
   * 
   * @param {String} name 
   * @param {Object} cfg 
   * @returns 
   */
  getBaseSettings (name, cfg = {}) {
    cfg.level = settings.level
    cfg.format = settings.format
    if (settings.customLevel[name]) cfg.level = settings.customLevel[name]
    return cfg
  }

  getConfig () { return this._config }

  get level () {
    return this._level
  }

  set level (lvl) {
    this._level = lvl
    // ToDo: set the logger and fire event
  }

  get format () {
    return this._format
  }

  set format (format) {
    this._format = format
    // ToDo: set the logger and fire event
  }

  _generateLoggerFns () {
    Object.entries(levelInfo).forEach(([k, v]) => {
      this[k] = function (msg) {
        this._logger.log({
          level: v.level || k,
          message: msg,
          subtype: k
        })
      }
    })
  }

  test (level, levelAt) {
    if (level === true) return true
    if (!levelAt) levelAt = this.level
    const levelsArray = Object.keys(levels)
    return levelsArray.indexOf(level) <= levelsArray.indexOf(levelAt)
  }

  log (...args) { return this._logger.log(...args) }
  out (msg, opts = {}) {
    opts = {
      ...{
        level: true,
        styles: null
      },
      ...opts
    }
    let msgOut = msg
    if (opts.styles) msgOut = this.style(opts.styles)(msg)
    if (this.test(opts.level)) console.log(msgOut)
  }

  style (styles) {
    let call = chalk
    if (styles) {
      if (typeof styles === 'string') styles = styles.split('.')
      styles.forEach((style) => {
        if (chalk[style]) call = call[style]
      })
    }
    return call
  }

  heading (msg, opts = {}) {
    opts = {
      ...{
        level: 'info',
        styles: 'bold',
        subhead: false
      },
      ...opts
    }
    if (new Date().getMonth() === 5 && this.fun === true) msg = this.rainbow(msg)
    msg = this.style(opts.styles)(msg)
    if (opts.subhead) msg += `\n${opts.subhead}`
    this.out(`\n${msg}\n`, { level: opts.level })
  }

  testLevels () {
    Object.entries(this._logger.levels).forEach(([k, v]) => {
      this._logger[k](k)
    })
    this.success('Success')
  }
}

const Logger = new PandaLogger()
module.exports = Logger
