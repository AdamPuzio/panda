#!/usr/bin/env node

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.Command()

program
  .description('Get information about the current Project and how it will be run')
  .option('-r, --rollup', 'Display rollup version')
  .option('-j, --json', 'Output in JSON format')
  .option('-l, --live', 'Output live values')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    const logger = cmd.logger
    logger.debug(`command: project-info`)
    let options = await Wasp.parse(cmd)

    Core.ctx.outputPretty()
  })

program.parse(process.argv)