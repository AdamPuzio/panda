#!/usr/bin/env node

const PandaCore = require('panda-core')
const Factory = PandaCore.Factory
const Wasp = PandaCore.Wasp
const program = new Wasp.Command()

program
  .description('Create a new Project')
  .argument('[name]')
  .option('--name', 'The name of the project')
  .option('--slug', 'The slug and filename of the project being built')
  .option('--test-tool', 'Test framework')
  .option('--build-tool', 'Build tool')
  .option('--css-tool', 'CSS Preprocessor tool')
  .option('--lint-tool', 'Linting tool')
  .option('--scaffold', 'The scaffold to apply', 'project/templates/skeleton')
  .option('--scaffold-dir', 'The scaffolding directory to use')
  .option('--scaffold-list', 'List the available scaffolds to use')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (name, opts, cmd) => {
    const logger = cmd.logger
    logger.debug(`command: create-project`)

    // check to make sure we are NOT in a Project, Panda or PandaDev directory
    await Wasp.locationTest(['notInProject', 'notInPanda', 'notInPandaDev'])

    await Wasp.parseScaffold(cmd, 'project', { interactiveMode: !name, mapping: { name } })
    .then(() => { logger.success('Project successfully created') })
    .catch((err) => {
      logger.error('Project creation failed')
      logger.error(err.toString())
    })
  })

program.parse(process.argv)