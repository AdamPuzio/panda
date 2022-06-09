#!/usr/bin/env node

const Panda = require('../')
const Core = Panda.Core
const Wasp = Core.Wasp
const packageJson = require('../package.json')
// const { Command, Option } = Panda.Core.Wasp
const { Command } = require('commander')
const program = new Command()

Wasp.clear()

program
  .description('Panda Development Framework CLI')
  .version(packageJson.version, '-v, --version')

  /* +++ core commands +++ */ // do not remove
  .command('app:run', 'Run an Application and all Services')
  .command('command:create', 'Create a new Command')
  .command('component:create', 'Create a new Component')
  .command('ctx', 'Get information about the current Project and how it will be run')
  .command('model:create', 'Create a new Model')
  .command('package:install', 'Install a new Package')
  .command('package:uninstall', 'Uninstall a Package')
  .command('project:create', 'Create a new Project')
  .command('project:deploy', 'Deploy the current Project')
  .command('project:info', 'Get information about the current Project and how it will be run')
  .command('route:create', 'Create a new Route')
  .command('serve', 'Serve static content from the current directory')
  .command('service:create', 'Create a new Service')
  .command('start', 'Start all Applications and Services')
  /* +++ internal commands +++ */ // do not remove
  .command('panda', 'panda', { hidden: true })
  .command('play', 'play', { hidden: true })
  .command('test:logging', 'Test logging functionality', { hidden: true })
  .command('project:fun', 'Information about the current Project', { hidden: true })
  /* +++ shortcut commands +++ */ // do not remove
  .command('run', 'Run an Application and all Services', { executableFile: 'panda-app:run' })
  .parse(process.argv)
