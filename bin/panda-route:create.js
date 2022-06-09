'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.ScaffoldCommand()

program
  .description('Create a new Route')
  .argument('[name]')
  .option('--name', 'The name of the route')
  .option('--slug', 'The slug and filename of the route being built')
  .action(async function (name, opts, cmd) {
    this.debug('command: route:create')

    this.heading('Creating a new Route')

    // check to make sure we are in a Project directory
    await this.confirmInProject()

    await this.parseScaffold('route', { interactiveMode: !name, mapping: { name } })
      .then(() => { this.success('Route successfully created') })
      .catch((err) => {
        this.exitError(err, 'Route creation failed')
      })
  })
  .parse(process.argv)
