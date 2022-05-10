#!/usr/bin/env node

const Panda = require('../')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()
const path = require('path')

program
  .description('Create a new model')
  .argument('[name]')
  .option('--name', 'The name of the service')
  .option('--slug', 'The slug and filename of the service')
  .option('--scaffold', 'The scaffold to apply', 'model/templates/mongoose')
  .option('--scaffold-dir', 'The scaffolding directory to use')
  .option('--scaffold-list', 'List the available scaffolds to use')
  .option('--no-fun', 'I\'m no fun')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (name, opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: create-model`)

    // check to make sure we are in a Project directory
    await Factory.confirmInProject()

    await Factory.checkScaffoldDataRequest('model', options)

    // if name exists, we'll use that instead of the interactive prompt
    if (name) {
      const check = name.length > 1 && /^[a-zA-Z0-9-_]+$/.test(name)
      if (!check) logger.exitError('model name must be at least 2 letters and alphanumeric (plus dash & underscore, no spaces)')
      options.name = name
      if(!options.slug) options.slug = Panda.Utility.slugify(name)
    }
    // use the entity specific question list
    if (!name) options = await Factory.inquire('model', options)
    
    const destFile = path.join(process.cwd(), 'app', 'models', options.slug + '.js')
    await Factory.build('model', options)
    .then(() => { logger.successMsg('Model successfully created!') })
    .catch((err) => {
      logger.errorMsg(err.toString())
      logger.errorMsg('Model creation failed')
    })
  })

program.parse(process.argv)