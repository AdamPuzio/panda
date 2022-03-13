#!/usr/bin/env node

'use strict'

const program = require('commander')
const Panda = require('../')
const path = require('path')
const ncp = require('ncp').ncp

program
  .command('run [type]')
  .description('Run the app')
  .option('-s, --services [services]', 'The services to run', '*')
  .option('-r, --repl', 'Run in REPL mode', false)
  .option('-c, --config [cfg]', 'Specify a config file', 'panda.config.js')
  .option('-p, --pkgdir [dir]', 'Specify a directory to load packages from', 'node_modules')
  .option('-a, --appdir [dir]', 'Specify a local app directory to load', 'app')
  .option('-l, --loglevel [level]', 'Specify a log level to use', 'debug')
  .action(async function (type, args) {
    const baseDir = path.join(process.cwd())

    // load config file
    const opts = {
      repl: args.repl
    }
    await Panda.Config.load(args.config, opts)

    // scan the service directory
    await Panda.PackageManager.scanPandaServiceDir()

    // scan the package directory (pkgdir)
    await Panda.PackageManager.scanPackageDir(args.pkgdir)

    // scan the application directory (appdir)
    await Panda.App.scanAppDir(path.join(baseDir, 'app'))

    // run the services
    await Panda.Core.runBroker(args.services, opts)
  })

program
  .command('create-app')
  .description('Create a new App directory')
  .action(async function (args) {
    console.log('Creating a new App')

    const sourceDir = path.join(__dirname, '..', 'prototype', 'site', 'app')
    const destDir = path.join(process.cwd(), 'app')

    // check to make sure the destination directory does NOT exist
    const destDirExists = await Panda.Utility.fileExists(destDir)
    if (destDirExists) return errorMsg(`App source directory (${destDir}) already exists, unable to overwrite`)

    console.log('Copying app directory structure...')
    console.log('    dest: ' + destDir)

    ncp(sourceDir, destDir, function (err) {
      if (err) return errorMsg(err)

      return successMsg('done!')
    })
  })

program
  .command('create-service [svc]')
  .description('Create a new Service')
  .action(async function (svc, args) {
    console.log('Creating a new Service')
    if (!svc) throw new Error('Can\'t create a Service without a name')

    const sourceFile = path.join(__dirname, '..', 'prototype', 'templates', 'service.js')
    const svcDir = path.join(process.cwd(), 'app', 'services')
    const destFile = path.join(process.cwd(), 'app', 'services', svc + '.service.js')

    console.log('Creating Service...')
    console.log('    dest: ' + destFile)

    // check to make sure the directory exists
    const svcDirExists = await Panda.Utility.fileExists(svcDir)
    if (!svcDirExists) return errorMsg(`Service directory (${svcDir}) does not exist`)

    const sourceFileExists = await Panda.Utility.fileExists(sourceFile)
    if (!sourceFileExists) throw new Error(`Source file (${sourceFile}) does not exist`)
    const sourceFileContent = await Panda.Utility.getFile(sourceFile)

    const content = await Panda.Utility.template(sourceFileContent, {
      svc: svc
    })
    const rs = await Panda.Utility.setFile(destFile, content)
    if (rs === false) return errorMsg(`Failed to write to file ${destFile}`)

    successMsg(`SUCCESS!`)
  })

  function errorMsg (err) {
    return console.log(`\x1b[31mERROR: ${err}\x1b[0m`)
  }

  function successMsg (msg) {
    if(!msg) msg = 'SUCCESS!'
    return console.log(`\x1b[32m${msg}\x1b[0m`)
  }

program.parse(process.argv)
