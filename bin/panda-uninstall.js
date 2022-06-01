#!/usr/bin/env node

const Panda = require('panda-core')
const Wasp = Panda.Wasp
const Factory = Panda.Factory
const program = new Wasp.Command()

program
  .description('Uninstall a Package')
  .argument('<pkg>', 'The Package to install')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (pkg, opts, cmd) => {
    const logger = cmd.logger
    logger.debug(`command: uninstall`)
    let options = await Wasp.parse(cmd)

    // check to make sure we are in a Project directory
    await Wasp.confirmInProject()
    
    await Factory.uninstallPackage(pkg, options)
      .then((rs) => { logger.info(`Successfully uninstalled ${pkg}`) })
      .catch((err) => { logger.exitError(err) })
  })

program.parse(process.argv)