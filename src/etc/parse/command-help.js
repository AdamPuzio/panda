'use strict'

class CommandParser {

  static TYPE_ALIASES = {
    bool: 'boolean',
    int: 'number',
    num: 'number',
    str: 'string',
  }

  static TYPE_CONVERT = {
    boolean: Boolean,
    number: Number,
    string: String
  }

  static parseHelp (text) {
    if (!text) return []
    const lines = CommandParser.parseText(text)
    CommandParser.normalizeIndent(lines)
    const paramList = []

    const params = lines.reduce((result, line) => {
      const param = CommandParser.extractParam(line.text)
      if (param) {
        paramList.push({...param})
        result[param.name] = param
        delete param.name
      }
  
      return result
    }, {})

    return paramList
  }
  
  static parseText (text) {
    const lines = text.split('\n')
      .map((line) => {
        let indent = 0
        line.replace(/^\s+/, m => indent += m.length)
        return {
          text: line.trim(),
          indent,
        }
      })
  
    while (lines[0] && !lines[0].text) {
      lines.shift()
    }
  
    while (lines[lines.length - 1] && !lines[lines.length - 1].text) {
      lines.pop()
    }
  
    return lines
  }
  
  static normalizeIndent (lines) {
    const minIndent = lines.reduce((min, line) => Math.min(min, line.indent), 80)
    lines.forEach(line => line.indent -= minIndent)
    return lines
  }

  static extractParam(text) {
    if (!text.startsWith('-')) {
      return
    }
  
    const [_, name1, name2, type, desc] = text.match(
      /(-[\w.-]+),?\s*(-[\w.-]+)?=?\s*(bool|boolean|int|num|number|str|string)?\s(.*)/i
    ) || []
  
    if (!name1) {
      return
    }
  
    const param = CommandParser.separateNameAndAlias(name1, name2)
    if (type) {
      param.type = type.toLowerCase()
      if (CommandParser.TYPE_ALIASES[param.type]) param.type = CommandParser.TYPE_ALIASES[param.type]
      if (CommandParser.TYPE_CONVERT[param.type]) param.type = CommandParser.TYPE_CONVERT[param.type]
    }

    if (desc) param.description = desc.trim()
  
    return param
  }

  static separateNameAndAlias(rawName1, rawName2) {
    const name1 = rawName1 && rawName1.replace(/^-*/, '')
    const name2 = rawName2 && rawName2.replace(/^-*/, '')
    const dashes1 = rawName1 && rawName1.search(/[^-]/)
    const dashes2 = rawName1 && rawName1.search(/[^-]/)
  
  
    if (!name2) {
      return { name: name1 }
    }
  
    if (dashes1 > dashes2) {
      return { name: name1, alias: name2 };
    }
  
    if (dashes2 > dashes1) {
      return { name: name2, alias: name1 };
    }
  
    if (name1.length > name2.length) {
      return { name: name1, alias: name2 };
    }
  
    return { name: name2, alias: name1 };
  }

  static parseArgString (argStr) {
    const argList = argStr.trim().split(' ')
    const args = []

    argList.forEach(i => {
      const [name, type] = i.trim().slice(1, -1).split(':')
      const arg = { name }
      if (name === 'command') arg.subcommand = true
      if (i.startsWith('<')) {
        arg.required = true
        args.push(arg)
      } else if (i.startsWith('[')) {
        args.push(arg)
      }
    })

    return args
  }

  static generateArgString (baseCmds, args) {
    if (Array.isArray(args) === false) return ''
    let argStr = `$ ${baseCmds.join(' ')}`
    args.forEach(arg => {
      if (arg.required === true) {
        argStr += ` <${arg.name}>`
      } else {
        argStr += ` [${arg.name}]`
      }
    })
    argStr += ' [OPTIONS]'
    return argStr
  }

  static generateCommandList (commands) {
    const cmdlist = []
    Object.values(commands).forEach(el => {
      if (el._cfg.hidden === true) return
      cmdlist.push({
        name: el.cfg.command,
        summary: el.cfg.description
      })
    })
    return cmdlist
  }
}

module.exports = CommandParser