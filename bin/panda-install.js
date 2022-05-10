#!/usr/bin/env node

const { exit } = require('process')
const Panda = require('../')
const Factory = require('../src/factory')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description('install a new package')
  .argument('[package]')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (pkg, opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: install`)

    logger.infoMsg('TESTING')
    // check to make sure we are in a Project directory
    await Factory.confirmInProject()

    logger.infoMsg(`Retrieving package information...`)
    const childProcess = require('child_process')
    // check for the name of the package
    const pkgName = childProcess.execSync(`npm view ${pkg} name`).toString().trim()
    logger.info(`Package Name: ${pkgName}`)

    await Factory.installPackage(pkg, options)

    logger.successMsg(`Successfully installed ${pkg}`)
  })

program.parse(process.argv)