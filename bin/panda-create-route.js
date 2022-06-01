#!/usr/bin/env node

const Panda = require('../')
const Factory = Panda.Core.Factory
const Wasp = Panda.Core.Wasp
const program = new Wasp.Command()

program
  .description('Create a new Route')
  .argument('[name]')
  .option('--name', 'The name of the route')
  .option('--slug', 'The slug and filename of the route being built')
  .option('--scaffold', 'The scaffold to apply', 'route/templates/skeleton')
  .option('--scaffold-dir', 'The scaffolding directory to use')
  .option('--scaffold-list', 'List the available scaffolds to use')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (name, opts, cmd) => {
    const logger = cmd.logger
    logger.debug(`command: create-route`)

    // check to make sure we are in a Project directory
    await Wasp.confirmInProject()

    await Wasp.parseScaffold(cmd, 'route', { interactiveMode: !name, mapping: { name } })
    .then(() => { logger.success('Route successfully created') })
    .catch((err) => {
      logger.error('Route creation failed')
      logger.error(err.toString())
    })
  })

program.parse(process.argv)