'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.ScaffoldCommand()

program
  .description('Create a new Component')
  .argument('[name]')
  .option('--name', 'The name of the component')
  .option('--slug', 'The slug and filename of the component being built')
  .action(async function (name, opts, cmd) {
    this.debug('command: component:create')

    this.heading('Creating a new Component')

    // check to make sure we are in a Project directory
    await this.confirmInProject()

    await this.parseScaffold('component', { interactiveMode: !name, mapping: { name } })
      .then(() => { this.success('Component successfully created') })
      .catch((err) => {
        this.exitError(err, 'Component creation failed')
      })
  })
  .parse(process.argv)
