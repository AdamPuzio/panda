#!/usr/bin/env node

const Panda = require('../')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description('uninstall a new package')
  .argument('[package]')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (pkg, opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: uninstall`)

    // check to make sure we are in a Project directory
    await Factory.confirmInProject()

    logger.infoMsg(`Uninstalling Package ${pkg}...`)
    if (!pkg) return logger.errorMsg('No Package provided')
    const childProcess = require('child_process')
    childProcess.execSync(`npm uninstall ${pkg}`, { stdio: [0, 1, 2] })

    logger.successMsg(`Successfully uninstalled ${pkg}`)
  })

program.parse(process.argv)