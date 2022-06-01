#!/usr/bin/env node

const PandaCore = require('panda-core')
const Wasp = PandaCore.Wasp
const Project = require('../src/project')
const program = new Wasp.Command()

program
  .description('playing around')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    logger = cmd.logger
    logger.debug(`command: play`)
    let options = await Wasp.parse(cmd)

    // check to make sure we are in a Project directory
    //await Wasp.confirmInProject()

    const projectInfo = await Project.build()

    //const output = options.json ? projectInfo : logger.tableOut(projectInfo, true)
    console.log(JSON.stringify(projectInfo, null, 2))
    //logger.tableOut(projectInfo)
  })

program.parse(process.argv)