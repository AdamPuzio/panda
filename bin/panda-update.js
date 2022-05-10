#!/usr/bin/env node

const Panda = require('../')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()
const semver = require('semver')
const childProcess = require('child_process')

program
  .description('check for an update of Panda')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: update`)

    logger.out('checking to see if Panda is update to date...', 'green')

    const isInstalledGlobally = require('is-installed-globally')
    //const npmGlobalRoot = childProcess.execSync(`npm root -g`).toString().trim()

    const localVersion = '0.3.5' //Panda.VERSION
    logger.info(`local version: ${localVersion}`)

    const latestVersion = childProcess.execSync(`npm show panda version`).toString().trim()
    logger.info(`latest version: ${latestVersion}`)

    if (localVersion === latestVersion) {
      logger.successMsg(`congratulations! you are currently up to date with version ${localVersion}`)
    } else if (semver.gt(latestVersion, localVersion)) {
      // ToDo: add prompt to ask to automatically upgrade
      const flag = isInstalledGlobally ?  '-g' : ''
      logger.out(`there is a newer version available`, 'yellow.bold')
      logger.out(`run 'npm update panda${flag}' to upgrade`, 'yellow.bold')
    } else {
      logger.out(`are you a wizard or do you work for the dev team?`, 'yellow.bold')
    }
  })

program.parse(process.argv)