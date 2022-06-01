#!/usr/bin/env node

const Panda = require('panda-core')
const Wasp = Panda.Wasp
const Factory = Panda.Factory
const program = new Wasp.Command()

program
  .description('Install a new Package')
  .argument('<pkg>', 'The Package to install')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (pkg, opts, cmd) => {
    const logger = cmd.logger
    logger.debug(`command: install`)
    let options = await Wasp.parse(cmd)

    // check to make sure we are in a Project directory
    await Wasp.confirmInProject()

    await Factory.installPackage(pkg, options)
      .then((rs) => { logger.info(`Successfully installed ${rs.name}`) })
      .catch((err) => { logger.exitError(err) })
  })

program.parse(process.argv)