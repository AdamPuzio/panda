#!/usr/bin/env node

'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.Command()
const Hub = require('../src/hub')

program
  .description('Run an Application and all Services')
  .argument('<app>', 'The App to run')
  .action(async function (app, opts, cmd) {
    this.debug('command: run')

    this.heading(`Running the ${app} app and all Services`)

    // check to make sure we are in a Project directory
    await this.confirmInProject()

    // run it...
    Hub.start(app)
  })
  .parse(process.argv)
