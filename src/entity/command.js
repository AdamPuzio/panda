'use strict'

const Context = require('../context')
const Factory = require('../factory')
const Terminal = require('../terminal')
const Utility = require('../utility')
const Logger = require('../logger')
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
const glob = require('util').promisify(require('glob'))
const clargs = require('command-line-args')
const clusage = require('command-line-usage')
const inquirer = require('inquirer')

const CommandParser = require('../etc/parse/command-help')

/**
 * PandaCommand
 */
class PandaCommand {
  __terminalType = 'command'
  color = chalk
  fun = true

  commandsDir = ''
  cmdStack = []

  _cfgBase = {
    command: '',
    title: '',
    description: '',
    help: null,
    hidden: false,
    arguments: [],
    options: [],
    subcommandPattern: '**/*.js',
    subcommands: false,
    version: false,
  }
  _cfg = {}
  cfg = {
    hasSubcommands: false,
    subcommands: {},
    arguments: [],
    options: []
  }

  /**
   * PandaCommand constructor
   * 
   * @param {Object} data 
   * @param {Object} opts 
   * @returns 
   */
  constructor (cfg) {
    this.logger = Logger.getLogger('Command')
    this.logger.silly(`initialize Command`)

    this.init(cfg)

    Context.generateConfirmFns(this)

    return this
  }

  init (cfg={}) {
    this._cfg = cfg = {...this._cfgBase, ...cfg}
    const flds = ['command', 'description']
    flds.forEach(i => { if(cfg[i]) this.cfg[i] = cfg[i] })
    this.cmdStack.push(cfg.command)
    if (cfg.action) this.action = cfg.action

    // parse the help string
    const help = CommandParser.parseHelp(cfg.help)

    const opts = [].concat(help, cfg.options)
    opts.forEach(o => this.option(o) )

    let args = cfg.arguments
    if (typeof args === 'string') args = CommandParser.parseArgString(args)
    args.forEach(a => this.argument(a))

    const scs = this.getSubcommands()
    scs.forEach(s => this.subcommand(s))

    return this
  }

  async parse (argv) {
    this.logger.silly('Command.parse()')

    if (!argv) argv = process.argv

    const argMix = [].concat(this.cfg.arguments, this.cfg.options)
    const primaryParse = clargs(argMix, { argv, stopAtFirstUnknown: true, camelCase: true })

    const all = Object.assign({}, primaryParse._all || primaryParse)

    Object.keys(primaryParse._args || []).forEach(e => delete all[e])
    const etc = {
      argv: primaryParse._unknown || [],
      opts: primaryParse
    }
    const fnargs = [all, etc]
    // if any args are potentially available, add the args object first
    if (this.cfg.arguments.length > 0) fnargs.unshift(primaryParse._args)
    await this.action(...fnargs)

    return this
  }

  async parseScaffold (scaffoldType, opts={}) {
    this.debug(`Command.parseScaffold(${scaffoldType})`)
    if (!opts.scaffold) {
      const scaffoldList = await Factory.getScaffoldList(scaffoldType)
      const scaffoldListAdjusted = scaffoldList.map(scaff => {
        return {
          name: scaff.name,
          value: scaff.path
        }
      })
      
      if (scaffoldListAdjusted.length > 1) {
        const scaffoldAsk = await inquirer.prompt([
          {
            type: 'list',
            name: 'scaffold',
            message: 'Project Scaffold:',
            choices: scaffoldListAdjusted
          }
        ])
        opts.scaffold = scaffoldAsk.scaffold
      } else if (scaffoldListAdjusted.length === 1) {
        opts.scaffold = scaffoldListAdjusted[0].value
      } else if (scaffoldListAdjusted.length === 0) {
        throw new Error(`No scaffolds found for ${Utility.nameify(scaffoldType)}s`)
      }
    }
    const scaffold = await Factory.getScaffold(opts.scaffold)
    if (!scaffold) throw new Error(`${opts.scaffold} is not a valid scaffold`)
    const answers = await inquirer.prompt(scaffold.interface, opts)
    await scaffold.build(answers)
    return
  }

  async action (args, opts, etc) {
    if (opts.version) return console.log(this._cfg.version || 'version unavailable')
    if (!args.command) return this.generateHelp()
    const cmd = this.getSubcommand(args.command)
    if (args.command && opts.help) return cmd.generateHelp()

    cmd.parse(etc.argv)
    return this
  }

  argument (arg) {
    arg = {...{
      name: arg.name,
      subcommand: false,
      defaultOption: arg.defaultOption === true || arg.subcommand === true,
      multiple: false,
      group: '_args'
    }, ...arg}

    if (arg.subcommand === true) this.cfg.hasSubcommands = true
    
    this.cfg.arguments.push(arg)

    return this
  }

  option (opt) {
    // ToDo: check for string and parse
    if (!opt.name) throw new Error(`Options require name`)
    const match = this.cfg.options.findIndex(({ name }) => name === opt.name)
    
    if (match !== -1) {
      this.cfg.options[match] = {...this.cfg.options[match], ...opt}
    } else {
      this.cfg.options.push(opt)
    }

    return this
  }

  subcommand (command) {
    const cfg = command.cfg
    command.cmdStack = [].concat(this.cmdStack, command.cmdStack)
    this.cfg.subcommands[cfg.command] = command
    return this
  }

  getSubcommands () {
    const subcommands = []
    if (this.cfg.hasSubcommands === false) return []
    const mainDir = this.commandsDir || path.dirname(require.main.filename)
    const options = { ignore: [require.main.filename] }
    const pattern = this._cfg.subcommandPattern
    const patternPath = path.join(mainDir, pattern)
    const matches = glob.sync(patternPath, options)
    matches.forEach(file => {
      const ref = require(file)
      if(ref.__terminalType !== 'command') return
      this.subcommand(ref)
    })
    return subcommands
  }

  getSubcommand (command) {
    const mainDir = this.commandsDir || path.dirname(require.main.filename)

    const cmd = this.cfg.subcommands[command]
    if (!cmd) throw new Error(`Subcommand ${command} not found`)

    return cmd
  }

  /**
   * Output a help section on --help
   */
  generateHelp () {
    const data = this.cfg
    const sections = []
    let content = data.description
    if (data.useStaticHelp === true) {
      content += '\n' + data.help
      if (data.helpAdd) content += '\n\n' + data.helpAdd
      sections.push({ header: data.title || `Command: ${data.command}`, content: content })
    } else {
      if (data.helpAdd) content += '\n\n' + data.helpAdd
      sections.push({ header: data.title || `Command: ${data.command}`, content: content })
      if (data.usage) sections.push({ header: 'Usage', content: data.usage })
      const argStr = CommandParser.generateArgString(this.cmdStack, data.arguments)
      sections.push({ header: 'Usage', content: argStr })
      if (data.options.length > 0) sections.push({ header: 'Options', optionList: data.options })

      if (data.hasSubcommands) sections.push({ header: 'Commands', content: CommandParser.generateCommandList(data.subcommands) })
    }
    console.log(clusage(sections))
    process.exit()
  }

  async locationTest (locRef, opts = {}) {
    opts = { ...{ onFail: 'throw' }, ...opts }
    await Context.locationTest(locRef, opts)
      .catch((err) => {
        this.exitError(err, err.toString())
      })
  }


  spacer () { console.log() }
  //clear () { process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H') }
  log (msg, opts = {}) {
    opts = {
      ...{
        level: true,
        styles: null
      },
      ...opts
    }
    if (this.test(opts.level)) console.log(this.style(opts.styles)(msg))
  }
  out (msg, opts={}) { this.log(msg, opts) }
  debug (msg, opts={}) { return this.logger.debug(msg, opts) }
  success (msg, opts={}) { return this.logger.info(msg, opts) }
  test (level, levelAt) { return this.logger.test(...arguments) }

  exitError (err, msg) {
    if (msg) this.logger.error(msg || err.toString())

    if (this.test('debug')) console.log(err)
    else if (!msg) this.logger.error(err)
    else if (typeof err.toString !== 'undefined') this.logger.error(err.toString())
    this.spacer()
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