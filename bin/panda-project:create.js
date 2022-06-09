'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.ScaffoldCommand()

program
  .description('Create a new Project')
  .argument('[name]')
  .option('--name', 'The name of the project')
  .option('--slug', 'The slug and filename of the project being built')
  .action(async function (name, opts, cmd) {
    this.debug('command: project:create')

    this.heading('Creating a new Project')

    // check to make sure we are NOT in a Project, Panda, PandaCore or PandaDev directory
    await this.locationTest(['notInProject', 'notInPanda', 'notInPandaCore', 'notInPandaDev'])

    await this.parseScaffold('project', { interactiveMode: !name, mapping: { name } })
      .then(() => { this.success('Project successfully created') })
      .catch((err) => {
        this.exitError(err, 'Project creation failed')
      })
  })
  .parse(process.argv)
