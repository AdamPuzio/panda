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
    await Panda.App.scanAppDir(args.appdir)

    // run the services
    await Panda.Core.runBroker(args.services, opts)
  })

program
  .command('create [type]')
  .description('Create a new App directory')
  .action(function (type, args) {
    console.log('Creating a new App')

    const sourceDir = path.join(__dirname, '..', 'prototype', 'site', 'app')
    const destDir = path.join(process.cwd(), 'app')

    console.log('Copying app directory structure...')
    console.log('    dest: ' + destDir)

    ncp(sourceDir, destDir, function (err) {
      if (err) return console.error(err)

      console.log('done!')
    })
  })

program.parse(process.argv)
