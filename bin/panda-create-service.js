#!/usr/bin/env node

const PandaCore = require('panda-core')
const Factory = PandaCore.Factory
const Wasp = PandaCore.Wasp
const program = new Wasp.Command()

program
  .description('Create a new Service')
  .argument('[name]')
  .option('--name', 'The name of the service')
  .option('--slug', 'The slug and filename of the service being built')
  .option('--scaffold', 'The scaffold to apply', 'service/templates/skeleton')
  .option('--scaffold-dir', 'The scaffolding directory to use')
  .option('--scaffold-list', 'List the available scaffolds to use')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (name, opts, cmd) => {
    const logger = cmd.logger
    logger.debug(`command: create-service`)

    // check to make sure we are in a Project directory
    await Wasp.confirmInProject()

    await Wasp.parseScaffold(cmd, 'service', { interactiveMode: !name, mapping: { name } })
    .then(() => { logger.success('Service successfully created') })
    .catch((err) => {
      logger.error('Service creation failed')
      logger.error(err.toString())
    })
  })

program.parse(process.argv)