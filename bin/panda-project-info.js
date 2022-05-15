#!/usr/bin/env node

const Panda = require('../')
const Factory = require('../src/factory')
const Core = require('../src/core')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description('get information about the current project')
  .option('-j, --json', 'Return as JSON')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    cmd.logger.debug(`command: project-info`)
    let options = Wasp.parse(cmd)

    // check to make sure we are in a Project directory
    await Factory.confirmInProject()

    const projectInfo = Core.getProjectJson()

    const output = options.json ? projectInfo : cmd.logger.prettyjson(projectInfo)
    console.log(output)
  })

program.parse(process.argv)