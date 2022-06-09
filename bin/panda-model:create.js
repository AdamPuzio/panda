'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.ScaffoldCommand()

program
  .description('Create a new Model')
  .argument('[name]')
  .option('--name', 'The name of the model')
  .option('--slug', 'The slug and filename of the model being built')
  .action(async function (name, opts, cmd) {
    this.debug('command: model:create')

    this.heading('Creating a new Model')

    // check to make sure we are in a Project directory
    await this.confirmInProject()

    await this.parseScaffold('model', { interactiveMode: !name, mapping: { name } })
      .then(() => { this.success('Model successfully created') })
      .catch((err) => {
        this.exitError(err, 'Model creation failed')
      })
  })
  .parse(process.argv)
