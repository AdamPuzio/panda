#!/usr/bin/env node

const Panda = require('../')
const Hub = require('../src/hub')
const Wasp = Panda.Wasp
const program = new Wasp.Command()

program
  .description('Run an Application and all Services')
  .argument('<app>', 'The App to run')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (app, opts, cmd) => {
    const logger = cmd.logger
    logger.debug(`command: run`)
    let options = await Wasp.parse(cmd)

    // check to make sure we are in a Project directory
    await Wasp.confirmInProject()

    // run it...
    Hub.start(app)
  })

program.parse(process.argv)