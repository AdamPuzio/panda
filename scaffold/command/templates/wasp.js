#!/usr/bin/env node

const Panda = require('panda')
const Wasp = Panda.Wasp
const program = new Wasp.Command()

program
  .description('<%-data.desc%>')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    cmd.logger.debug(`command: <%-data.command%>`)
    let options = Wasp.parse(cmd)
    
  })

program.parse(process.argv)