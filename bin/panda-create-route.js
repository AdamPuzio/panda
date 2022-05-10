#!/usr/bin/env node

const Panda = require('../')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description('create new route')
  .argument('[name]')
  .option('--name', 'The name of the route')
  .option('--slug', 'The slug and filename of the route being built')
  .option('--scaffold', 'The scaffold to apply', 'default')
  .option('--scaffold-dir', 'The scaffolding directory to use')
  .option('--scaffold-list', 'List the available scaffolds to use')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (name, opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: create-route`)

    // check to make sure we are in a Project directory
    await Factory.confirmInProject()

    // check for any data requests
    await Factory.checkScaffoldDataRequest('route', options)

    
  })

program.parse(process.argv)