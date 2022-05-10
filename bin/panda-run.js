#!/usr/bin/env node

const Panda = require('../')
const Utility = require('../src/util')
const Factory = require('../src/factory')
const { Command } = require('commander')
const program = new Command()
const inquirer = require('inquirer')
const path = require('path')

async function run() {
  /**
   * panda run
   */
  program
    .description('Run the app')
    .option('-s, --services [services]', 'The services to run', '*')
    .option('-i, --ignore [services]', 'The services to ignore', '')
    .option('-r, --repl', 'Run in REPL mode', false)
    .option('-c, --config [cfg]', 'Specify a config file', 'panda.config.js')
    .option('-p, --pkgdir [dir]', 'Specify a directory to load packages from', 'node_modules')
    .option('-a, --appdir [dir]', 'Specify a local app directory to load', 'app')
    .option('-l, --loglevel [level]', 'Specify a log level to use', 'debug')

  program.parse(process.argv)

  const app = program.args[0] || 'web'
  const args = program.opts()

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
}

run()