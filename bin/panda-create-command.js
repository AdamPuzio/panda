#!/usr/bin/env node

const Panda = require('../')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description('create a new command')
  .argument('[command]')
  .option('--command', 'The command that will get run')
  .option('--scaffold', 'The scaffold to apply', 'command/templates/wasp')
  .option('--scaffold-dir', 'The scaffolding directory to use')
  .option('--scaffold-list', 'List the available scaffolds to use')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (command, opts, cmd) => {
    cmd.logger.debug(`command: create-command`)
    let options = Wasp.parse(cmd)

    // check to make sure we are in a Project directory
    await Factory.confirmInProject()
    const projectInfo = options.projectInfo = await Factory.readProjectJson()

    // check for any data requests
    await Factory.checkScaffoldDataRequest('command', options)

    // if command exists, we'll use that instead of the interactive prompt
    if (command) options.command = command
    
    // interactive prompt using the entity specific question list
    if (!command) options = await Factory.inquire('command', options)

    // build based off of the responses
    await Factory.build('command', options)
    .then(() => { 
      cmd.logger.info('Command successfully created!') 
      // ToDo: add instructions to run command
      const command = `npm run ${projectInfo.slug} ${options.command}`
      cmd.logger.info(`Run your command: ${command}`)
    })
    .catch((err) => {
      cmd.logger.error(err.toString())
      cmd.logger.error('Command creation failed')
    })
  })

program.parse(process.argv)