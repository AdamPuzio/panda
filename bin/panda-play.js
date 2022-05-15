#!/usr/bin/env node

const Panda = require('..')
const { Command, Option, parse } = require('../src/wasp')
const command = new Command()

command
  .description('Playground for trying out new stuff')
  .option('--no-fun', 'I\'m no fun')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    cmd.logger.debug(`command: play`)

    const logLevel = cmd.logger._logger.level
    cmd.logger.out(`-- logLevel: ${logLevel} --`)

    cmd.logger.info('Welcome to the playground...')
  })

command.parse(process.argv)