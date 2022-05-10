#!/usr/bin/env node

const Panda = require('panda')
const Factory = Panda.Factory
const Wasp = Panda.Wasp
const program = new Wasp.Command()

program
  .description('<%-data.desc%>')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    
  })

program.parse(process.argv)