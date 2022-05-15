#!/usr/bin/env node

const Panda = require('../')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description('<%-data.desc%>')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    cmd.logger.debug(`command: <%- data.command %>`)
    let options = Wasp.parse(cmd)

    // check to make sure we are in a Project directory
    await Factory.confirmInProject()

    
  })

program.parse(process.argv)