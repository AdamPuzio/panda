#!/usr/bin/env node

'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.Command()

program
  .description('Test logging functionality')
  .action(async function (opts, cmd) {
    this.debug('command: test:logging')

    this.heading('Log Level Test')

    const levels = Object.keys(this.logger.levels)
    this.info(`Log Levels: ${levels.join(' | ')}`)
    this.spacer()
    levels.forEach((k) => {
      this[k](`log level test for: ${k}`)
    })
  })
  .parse(process.argv)
