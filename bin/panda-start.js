#!/usr/bin/env node

'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.Command()
const Hub = require('../src/hub')

program
  .description('Start all Applications and Services')
  .action(async function (opts, cmd) {
    this.debug('command: start')

    this.heading('Starting all Applications and Services')

    // check to make sure we are in a Project directory
    await this.confirmInProject()

    // run it...
    Hub.start()
  })
  .parse(process.argv)
