#!/usr/bin/env node

const Panda = require('../')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description('create a new project')
  .argument('[name]')
  .option('--name', 'The name of the Project')
  .option('--slug', 'The slug and filename of the Project')
  .option('--test-tool', 'Test framework')
  .option('--build-tool', 'Build tool')
  .option('--css-tool', 'CSS Preprocessor tool')
  .option('--lint-tool', 'Linting tool')
  .option('--scaffold', 'The scaffold to apply', 'project/templates/skeleton')
  .option('--scaffold-dir', 'The scaffolding directory to use')
  .option('--scaffold-list', 'List the available scaffolds to use')
  .option('--no-fun', 'I\'m no fun')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (name, opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: create-project`)

    // check to make sure we are NOT in a Project directory
    await Factory.confirmNotInProject()

    await Factory.checkScaffoldDataRequest('project', options)

    // if name exists, we'll use that instead of the interactive prompt
    if (name) {
      options.name = name
      if (!options.slug) options.slug = Panda.Utility.slugify(options.name)
    }
    
    // use the entity specific question list
    if (!name) options = await Factory.inquire('project', options)

    await Factory.build('project', options)
    .then(() => { logger.successMsg('Project successfully created!') })
    .catch((err) => {
      logger.errorMsg(err.toString())
      logger.errorMsg('Project creation failed')
    })
  })

program.parse(process.argv)