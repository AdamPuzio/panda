'use strict'

const Context = require('../context')
const Terminal = require('../terminal')
const util = require('../utility')
const Logger = require('../logger')
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
const glob = require('util').promisify(require('glob'))
const clargs = require('command-line-args')
const clusage = require('command-line-usage')

/**
 * PandaCommand
 */
class PandaCommand {
  __terminalType = 'command'
  color = chalk
  fun = true

  data = {}
  commandsDir = ''

  /**
   * PandaCommand constructor
   * 
   * @param {Object} data 
   * @param {Object} opts 
   * @returns 
   */
  constructor (data, opts = {}) {
    this.data = data = this._generateBaseConfig(data)
    if (data.action) this.action = data.action

    this._generateConfirmFns()

    this.logger = Logger.getLogger('Command')
    Logger.generateLoggerFns(this)
    this.logger.silly(`initialize Command`)

    return this
  }

  get options () {
    return this.data.options || []
  }

  async action (args, opts, etc) {
    if (opts.version) return console.log(this.data.version)
    if (!args.command) return this.generateHelp()
    const cmd = this.getSubcommand(args.command)
    if (args.command && opts.help) return cmd.generateHelp()

    cmd.parse(etc.argv)
    return this
  }

  async parse (argv) {
    this.logger.silly('Command.parse()')
    if (!argv) argv = process.argv
    const args = this.processArguments()
    const opts = this.processOptions()

    const argMix = [].concat(args, opts)
    const primaryParse = clargs(argMix, { argv, stopAtFirstUnknown: true })

    const all = Object.assign({}, primaryParse._all || primaryParse)
    Object.keys(primaryParse._args || []).forEach(e => delete all[e])
    const etc = {
      argv: primaryParse._unknown || [],
      opts: primaryParse
    }
    const fnargs = [all, etc]
    // if any args are potentially available, add the args object first
    if (args.length > 0) fnargs.unshift(primaryParse._args)
    await this.action(...fnargs)

    return this
  }

  processArguments (args) {
    if (!args) args = this.data.arguments
    const argObj = []
    args.forEach((a) => {
      argObj.push({
        name: a.name,
        defaultOption: a.subcommand === true,
        multiple: typeof a.multiple === 'undefined' ? false : a.multiple,
        group: '_args'
      })
    })
    return argObj
  }

  processCommands (commands) {
    if (!commands) commands = this.data.commands
    const cmdlist = []
    commands.forEach(el => {
      if (el.hidden === true) return
      cmdlist.push({
        name: el.command,
        summary: el.description
      })
    })
    return cmdlist
  }

  processOptions (options) {
    if (!options) options = this.data.options
    if (!Array.isArray(options)) throw Error(`Options must be an array`)
    const opts = []
    options.forEach(el => {
      const obj = util.pick(el, {
        option: 'name',
        description: 'description',
        group: 'group',
        alias: 'alias',
        type: 'type'
      })
      if (obj.type && typeof obj.type === 'string') obj.type = global[obj.type]
      opts.push(obj)
    })
    return opts
  }

  getSubcommand (command) {
    const mainDir = this.commandsDir || path.dirname(require.main.filename)

    // ToDo: allow commands list to apply a custom filename
    const cmdfile = command.replace(':', '--')
    const filename = path.join(mainDir, `${this.data.command}-${cmdfile}`)
    if (!fs.existsSync(filename + '.js')) {
      this.exitError(`Command file for ${command} does not exist: ${filename}.js`)
    }
    const cmd = require(filename)

    return cmd
  }

  generateHelp () {
    const data = this.data
    const sections = []
    let content = data.description
    if (data.help) content += '\n\n' + data.help
    sections.push({ header: data.title || `Command: ${data.command}`, content: content })
    if (data.usage) sections.push({ header: 'Usage', content: data.usage })
    if (data.options.length > 0) sections.push({ header: 'Options', optionList: this.processOptions(data.options) })
    if (data.subcommands.length > 0) sections.push({ header: 'Commands', content: this.processCommands(data.subcommands) })
    console.log(clusage(sections))
    process.exit()
  }

  _generateBaseConfig (data) {
    return {...{
      command: '',
      title: '',
      description: '',
      hidden: false,
      arguments: [],
      subcommands: [],
      options: []
    }, ...data}
  }

  _generateConfirmFns () {
    const fns = Context.fns
    Object.keys(fns).forEach((k) => {
      this[k] = (opts = {}) => {
        opts = { ...{ onFail: 'throw' }, ...opts }
        Context.fns[k](opts)
          .catch((err) => {
            this.exitError(err, err.toString())
          })
      }
    })
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

  rainbow(string) {
    const ignoreChars = /[^!-~]/g
    if (!string || string.length === 0) return string
  
    const hueStep = 360 / string.replace(ignoreChars, '').length
  
    let hue = 0
    const characters = []
    for (const character of string) {
      if (character.match(ignoreChars)) {
        characters.push(character)
      } else {
        characters.push(chalk.hsl(hue, 100, 50)(character))
        hue = (hue + hueStep) % 360
      }
    }
  
    return characters.join('')
  }

  table (val) {
    const prettyjsonCfg = {}
    if (new Date().getMonth() === 5 && this.cmd.opts().fun === true) prettyjsonCfg.keysColor = 'rainbow'
    return prettyjson.render(val, prettyjsonCfg)
  }

  tableOut (val, level) {
    if (level && !this.test(level)) return
    const table = this.table(val)
    return console.log(table)
  }
}

module.exports = PandaCommand