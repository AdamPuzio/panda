#!/usr/bin/env node

const Panda = require('../')
const Utility = require('../src/util')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()
const path = require('path')

program
  .description('Create a new service')
  .argument('[name]')
  .option('--name', 'The name of the service')
  .option('--slug', 'The slug and filename of the service')
  .option('--scaffold', 'The scaffold to apply', 'service/templates/service')
  .option('--scaffold-dir', 'The scaffolding directory to use')
  .option('--scaffold-list', 'List the available scaffolds to use')
  .option('--port', 'Select a port to run a service app on')
  .option('--no-fun', 'I\'m no fun')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (name, opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: create-service`)

    // check to make sure we are in a Project directory
    await Factory.confirmInProject()

    await Factory.checkScaffoldDataRequest('service', options)

    // if name exists, we'll use that instead of the interactive prompt
    if (name) {
      options.name = name
      options.slug = Utility.slugify(name)
    }
    if (!name) options = await Factory.inquire('service', options)
    
    const destFile = path.join(process.cwd(), 'app', 'services', options.slug + '.service.js')
    await Factory.build('service', options)
    .then(() => { logger.successMsg('Service successfully created!') })
    .catch((err) => {
      logger.errorMsg(err.toString())
      logger.errorMsg('Service creation failed')
    })
  })

program.parse(process.argv)