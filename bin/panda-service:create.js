'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.ScaffoldCommand()

program
  .description('Create a new Service')
  .argument('[name]')
  .option('--name', 'The name of the service')
  .option('--slug', 'The slug and filename of the service being built')
  .action(async function (name, opts, cmd) {
    this.debug('command: service:create')

    this.heading('Creating a new Service')

    // check to make sure we are in a Project directory
    await this.confirmInProject()

    await this.parseScaffold('service', { interactiveMode: !name, mapping: { name } })
      .then(() => { this.success('Service successfully created') })
      .catch((err) => {
        this.exitError(err, 'Service creation failed')
      })
  })
  .parse(process.argv)
