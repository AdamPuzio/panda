#!/usr/bin/env node

'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.Command()
const ctx = Core.ctx.raw()
const util = Core.Utility

program
  .description('Get information about the current Project and how it will be run')
  .option('-j, --json', 'Output in JSON format')
  .action(async function (opts, cmd) {
    this.debug('command: ctx')

    this.debug(`log level: ${this.logger._logger.level}`)

    if (opts.json === true) return console.log(ctx)

    const color = this.color
    const maxLength = Math.max.apply(Math, Object.keys(ctx).map(function (el) { return el.length }))
    const title = color.bold
    const key = color.cyan
    const valFn = (v, spaces = 2) => {
      let val = ctx[v]
      const sp = ' '.repeat(spaces)
      if (typeof val === 'boolean') val = val ? color.green(val) : color.red(val)
      if (!val) val = color.dim(val)
      const spacing = maxLength + 3 - v.length - spaces
      const spacer = ' '.repeat(spacing > 0 ? spacing : 0)
      if (typeof val === 'object') {
        console.log(`${sp}${key('ctx.' + v)}:`)
        Object.entries(val).forEach(([k, v]) => {
          const subSpacing = maxLength + 3 - k.length - spaces
          const subSpacer = ' '.repeat(subSpacing + 2 > 0 ? subSpacing + 2 : 0)
          if (util._.isObject(v)) v = color.green(JSON.stringify(v))
          console.log(`    ${key(k)} ${subSpacer}${v}`)
        })
      } else {
        console.log(`${sp}${key('ctx.' + v)}:${spacer}${val}`)
      }
      delete ctx[v]
    }
    console.log(color.bold('CONTEXT:'))
    console.log()
    valFn('cwd', 0)
    valFn('context', 0)
    const lists = {
      Location: (k) => { return k.startsWith('in') },
      Path: (k) => { return k.endsWith('_PATH') },
      Version: (k) => { return k.endsWith('_VERSION') }
    }
    Object.entries(lists).forEach(([header, test]) => {
      console.log()
      console.log(title(`${header}:`))
      Object.entries(ctx).forEach(([k, v]) => {
        if (!test(k)) return
        valFn(k)
      })
    })
    console.log()
    console.log(title('Private Label:'))
    valFn('label')
    valFn('labelInfo')
    if (Object.keys(ctx).length > 0) {
      console.log()
      console.log(title('Other Variables:'))
      Object.entries(ctx).forEach(([k, v]) => {
        valFn(k)
      })
    }
  })
  .parse(process.argv)
