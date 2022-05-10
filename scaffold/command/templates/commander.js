#!/usr/bin/env node

const Panda = require('panda')
const Factory = Panda.Factory
const commander = require('commander')
const program = new commander.Command()

program
  .description('<%-data.desc%>')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    
  })

program.parse(process.argv)