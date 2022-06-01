#!/usr/bin/env node

const Wasp = require('panda-core').Wasp
const Hub = require('../src/hub')
const program = new Wasp.Command()

program
  .description('Start all Applications and Services')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    const logger = cmd.logger
    logger.debug(`command: start`)
    let options = await Wasp.parse(cmd)

    // check to make sure we are in a Project directory
    await Wasp.confirmInProject()

    // run it...
    Hub.start()
  })

program.parse(process.argv)