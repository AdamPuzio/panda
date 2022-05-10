#!/usr/bin/env node

const Panda = require('../')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description('Create a new Panda command')
  .argument('[command]')
  .option('--command', 'The command that will get run')
  .option('--scaffold', 'The scaffold to apply', 'command/templates/wasp-internal.js')
  .option('--scaffold-dir', 'The scaffolding directory to use')
  .option('--scaffold-list', 'List the available scaffolds to use')
  .option('--no-fun', 'I\'m no fun')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (command, opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: create-panda-command`)

    await Factory.checkScaffoldDataRequest('command/internal', options)

    // if command exists, we'll use that instead of the interactive prompt
    if (command) options.command = command
    
    // interactive prompt using the entity specific question list
    if (!command) options = await Factory.inquire('command/internal', options)

    // build based off of the responses
    await Factory.build('command/internal', options)
    .then(() => { logger.successMsg('Panda command successfully created') })
    .catch((err) => {
      logger.errorMsg(err.toString())
      logger.errorMsg('Panda command creation failed')
    })
  })

program.parse(process.argv)