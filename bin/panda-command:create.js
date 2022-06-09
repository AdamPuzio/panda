'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.ScaffoldCommand()

program
  .description('Create a new Command')
  .argument('[command]')
  .option('--command', 'The command that will get run')
  .action(async function (command, opts, cmd) {
    this.debug('command: command:create')

    this.heading('Creating a new Command', { subhead: 'Press Ctrl+C to cancel' })

    // check to make sure we are in a Project, Panda, PandaCore, PandaDev or PrivateLabel directory
    await this.locationTest(['inProject', 'inPanda', 'inPandaCore', 'inPandaDev', 'inPrivateLabel'], { operator: 'OR' })

    await this.parseScaffold('command', { interactiveMode: !command, mapping: { command } })
      .then(() => { this.success('Panda command successfully created') })
      .catch((err) => {
        this.exitError(err, 'Panda command creation failed')
        this.error('Command creation failed')
        this.debug(err)
      })
  })
  .parse(process.argv)
