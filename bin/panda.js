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
  .option('-i, --ignore [services]', 'The services to ignore', '')
  .option('-r, --repl', 'Run in REPL mode', false)
  .option('-c, --config [cfg]', 'Specify a config file', 'panda.config.js')
  .option('-p, --pkgdir [dir]', 'Specify a directory to load packages from', 'node_modules')
  .option('-a, --appdir [dir]', 'Specify a local app directory to load', 'app')
  .option('-l, --loglevel [level]', 'Specify a log level to use', 'debug')
  .action(async function (type, args) {
    const baseDir = path.join(process.cwd())

    // load config file
    const opts = {
      repl: args.repl,
      ignore: args.ignore
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
  .command('list-services')
  .description('List all available services from this build')
  .option('-c, --config [cfg]', 'Specify a config file', 'panda.config.js')
  .option('-p, --pkgdir [dir]', 'Specify a directory to load packages from', 'node_modules')
  .action(async function (args) {
    console.log('Generating list of services...')

    const baseDir = path.join(process.cwd())

    await Panda.Config.load(args.config)

    // scan the service directory
    await Panda.PackageManager.scanPandaServiceDir()

    // scan the package directory (pkgdir)
    await Panda.PackageManager.scanPackageDir(args.pkgdir)

    // scan the application directory (appdir)
    await Panda.App.scanAppDir(path.join(baseDir, 'app'))

    const svcList = await Panda.PackageManager.parseServiceList('*')
    const svcObj = {}
    svcList.forEach((val, key) => {
      const svc = val.split('/').pop().replace('.service.js', '')
      svcObj[svc] = val
    })
    console.log('Available Services:')
    console.log(svcObj)
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
    if (!svc) return errorMsg('Can\'t create a Service without a name')

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

    successMsg('SUCCESS!')
  })

program
  .command('create-route [rpath]')
  .description('Create a new Route')
  .action(async function (rpath, args) {
    console.log('Creating a new Route')
    if (!rpath) rpath = 'index'

    const sourceFile = path.join(__dirname, '..', 'prototype', 'templates', 'route.js')
    const routesDir = path.join(process.cwd(), 'app', 'routes')
    const destFile = path.join(process.cwd(), 'app', 'routes', rpath + '.js')

    console.log('Creating Route...')
    console.log('    dest: ' + destFile)

    // check to make sure the route doesn't already exists
    const destFileExists = await Panda.Utility.fileExists(destFile)
    if (destFileExists) return errorMsg(`Route file (${destFile}) already exists, unable to overwrite`)

    // check to make sure the directory exists
    const routesDirExists = await Panda.Utility.fileExists(routesDir)
    if (!routesDirExists) return errorMsg(`Routes directory (${routesDir}) does not exist`)

    // check to make sure the source file exists
    const sourceFileExists = await Panda.Utility.fileExists(sourceFile)
    if (!sourceFileExists) throw new Error(`Source file (${sourceFile}) does not exist`)
    const sourceFileContent = await Panda.Utility.getFile(sourceFile)

    const content = await Panda.Utility.template(sourceFileContent, {})
    const rs = await Panda.Utility.setFile(destFile, content)
    if (rs === false) return errorMsg(`Failed to write to file ${destFile}`)

    successMsg('SUCCESS!')
  })

function errorMsg (err) {
  return console.log(`\x1b[31mERROR: ${err}\x1b[0m`)
}

function successMsg (msg) {
  if (!msg) msg = 'SUCCESS!'
  return console.log(`\x1b[32m${msg}\x1b[0m`)
}

program.parse(process.argv)
