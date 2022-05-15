#!/usr/bin/env node

const Panda = require('../')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description('create a new project')
  .argument('[name]')
  .option('--name', 'The name of the project')
  .option('--slug', 'The slug and filename of the project being built')
  .option('--test-tool', 'Test framework')
  .option('--build-tool', 'Build tool')
  .option('--css-tool', 'CSS Preprocessor tool')
  .option('--lint-tool', 'Linting tool')
  .option('--scaffold', 'The scaffold to apply', 'default')
  .option('--scaffold-dir', 'The scaffolding directory to use')
  .option('--scaffold-list', 'List the available scaffolds to use')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (name, opts, cmd) => {
    cmd.logger.debug(`command: create-project`)
    let options = Wasp.parse(cmd)

    // check to make sure we are NOT in a Project directory
    await Factory.confirmNotInProject()

    // check for any data requests
    await Factory.checkScaffoldDataRequest('project', options)

    // if name exists, we'll use that instead of the interactive prompt
    if (name) {
      options.name = name
      if (!options.slug) options.slug = Panda.Utility.slugify(options.name)
    }
    
    // use the entity specific question list
    if (!name) options = await Factory.inquire('project', options)

    await Factory.build('project', options)
    .then(() => { 
      cmd.logger.info('Project successfully created!') 
      cmd.logger.info(`Please run 'cd ${options.slug}' to go to your project directory`)
    })
    .catch((err) => {
      cmd.logger.error(err.toString())
      cmd.logger.error('Project creation failed')
    })
  })

program.parse(process.argv)