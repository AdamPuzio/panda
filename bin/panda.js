#!/usr/bin/env node

const Panda = require('../')
const packageJson = require('../package.json')
const { Command, Option } = Panda.Core.Wasp
const program = new Command()

program
  .description('Panda Development Framework CLI')
  .version(packageJson.version, '-v, --version')
  /* +++ core commands +++ */ // do not remove
  .command('create-component', 'Create a new Component')
  .command('create-model', 'Create a new Model')
  .command('create-project', 'Create a new Project')
  .command('create-route', 'Create a new Route')
  .command('create-service', 'Create a new Service')
  .command('ctx', 'Get information about the current Project and how it will be run')
  .command('install', 'Install a new Package')
  .command('project-info', 'Get information about the current Project and how it will be run')
  .command('run', 'Run an Application and all Services')
  .command('start', 'Start all Applications and Services')
  .command('uninstall', 'Uninstall a Package')
  /* +++ internal commands +++ */ // do not remove
  .command('panda', 'panda', { hidden: true })
  .command('play', 'play', { hidden: true })
  /* +++ shortcut commands +++ */ // do not remove
  .parse(process.argv)
