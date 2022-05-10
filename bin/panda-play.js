#!/usr/bin/env node

const Panda = require('../')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description('Create a new service')
  .argument('[toy]')
  .option('--no-fun', 'I\'m no fun')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (toy, opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: play`)
    console.log()
    console.log(`debug: ${options.debug}`)
    console.log(`Let's try some calls:`)
    logger.out('  logger.out(magenta)', 'magenta')
    logger.out('  logger.out(orange) [should display normally, there is no orange]', 'orange')
    logger.errorMsg('  logger.errorMsg()')
    logger.successMsg('  logger.successMsg()')
    console.log('levels: ', logger._settings.levels)
    console.log(`current level: ${logger._settings.level}`)
    console.log('level tests:')
    logger._settings.levels.forEach((level) => {
      let levelTest = logger.levelTest(level) ? '' : ' (should NOT show)'
      console.log(`    level: ${level}${levelTest}:`)
      logger[level](`      ${level} test`)
    })
  })

program.parse(process.argv)