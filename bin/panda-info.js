#!/usr/bin/env node

const Panda = require('../')
const Utility = require('../src/util')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()
const path = require('path')
const envinfo = require('envinfo')
const chalk = require('chalk')
const { exit } = require('process')

program
  .description('provides basic information about the local instance and environment')
  .option('--no-fun', 'I\'m no fun')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: info`)
    const PandaConfig = Panda.getConfig()

    // merge the list of process.versions with some other important info
    // ToDo:
    // - add moleculer version
    const versions = {
      Panda: Panda.VERSION,
      ...Panda.Utility.pick(process.versions, ['node', 'v8', 'openssl'])
    }

    console.log('')
    console.log(chalk.bold.green.underline('Project Info'))
    console.log(logger.prettyjson({
      Panda: {
        VERSION: Panda.VERSION,
        APP_PATH: PandaConfig.get('APP_PATH'),
        PANDA_PATH: PandaConfig.get('PANDA_PATH'),
        LOG_LEVEL: PandaConfig.get('LOG_LEVEL')
      },
      directories: {
        __dirname,
        cwd: process.cwd(),
        projectDir: Panda.Core.determineProjectDirectory()
      },
      versions
    }))

    logger.debug('')
    logger.debug(chalk.bold.green.underline('Environment Info'))
    let envdata = await envinfo.run(
      {
          System: ['OS', 'CPU'],
          Binaries: ['Node', 'Yarn', 'npm'],
          Browsers: ['Chrome', 'Firefox', 'Safari'],
          npmPackages: ['panda', 'moleculer'],
      },
      { json: true, showNotFound: true }
    )
    if (typeof envdata === 'string') envdata = JSON.parse(envdata)
    logger.debug(logger.prettyjson(envdata))
  })

program.parse(process.argv)
