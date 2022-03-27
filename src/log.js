'use strict'

// const Config = require('./cfg').cfg
const Winston = require('winston')
const { combine, splat, timestamp, label } = Winston.format

const Colors = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  Blink: '\x1b[5m',
  Reverse: '\x1b[7m',
  Hidden: '\x1b[8m',

  FgBlack: '\x1b[30m',
  FgRed: '\x1b[31m',
  FgGreen: '\x1b[32m',
  FgYellow: '\x1b[33m',
  FgBlue: '\x1b[34m',
  FgMagenta: '\x1b[35m',
  FgCyan: '\x1b[36m',
  FgWhite: '\x1b[37m',

  BgBlack: '\x1b[40m',
  BgRed: '\x1b[41m',
  BgGreen: '\x1b[42m',
  BgYellow: '\x1b[43m',
  BgBlue: '\x1b[44m',
  BgMagenta: '\x1b[45m',
  BgCyan: '\x1b[46m',
  BgWhite: '\x1b[47m'
}

const myFormat = Winston.format.printf((info) => {
  const lvl = info[Symbol.for('level')].toUpperCase()
  let msg = `${Colors.Dim}[${info.timestamp}]${Colors.Reset} ${Colors.FgGreen}${lvl}${Colors.Reset}  ${Colors.FgCyan}${info.label}:${Colors.Reset} ${info.message} `
  if (info.metadata) {
    msg += JSON.stringify(info.metadata)
  }
  return msg
})

const defaultOptions = {}

/**
 * Logger class
 *
 * @class Logger
 */
class Logger {
  /**
   * Creates an instance of Logger
   *
   * @param {Object} options - Initialization options
   */
  constructor (options) {
    try {
      this.options = Object.assign({}, defaultOptions, options)
      this.cache = new Map()
    } catch (err) {
      console.log('Unable to create Logger', err)
    }
  }

  getLogger (loggerId = '', opts = {}) {
    let logger = PandaLogger.cache.get(loggerId)
    if (logger) return logger
    const level = process.env.LOG_LEVEL || opts.level || 'debug'

    logger = Winston.createLogger({
      level: level,
      format: combine(
        label({ label: loggerId, message: false }),
        Winston.format.colorize(),
        splat(),
        timestamp(),
        myFormat
      ),
      transports: [
        // new Winston.transports.Console({ level: 'info' }),
        new Winston.transports.Console({ level: level })
        // new transports.File({ filename: config.get("app.logging.outputfile"), level: 'debug' }),
      ]
    })

    PandaLogger.cache.set(loggerId, logger)
    return logger
  }

  style (style) {
    return this.Colors[style] || ''
  }

  reset () {
    return this.Colors.Reset
  }
}

const PandaLogger = new Logger()

module.exports = PandaLogger
