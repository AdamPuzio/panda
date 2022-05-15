#!/usr/bin/env node

const Panda = require('..')
const packageJson = require('../package.json')
const { Command, Option } = require('../src/wasp')
const program = new Command()

program
  .description('Panda Development Framework CLI')
  .version(packageJson.version, '-v, --version')
  // .option('-d, --debug [level]', 'Run in debug mode', false)
  // project commands
  .command('create-project', 'create a new project')
  .command('create-command', 'create a new command')
  .command('project-info', 'get information about the current project')
  // internal commands
  .command('play', 'playground', { hidden: true })
  .command('create-panda-command', 'panda', { hidden: true })
  .command('cpc', 'panda', { executableFile: 'panda-create-panda-command', hidden: true })
  .command('panda', 'panda', { hidden: true })
  .parse(process.argv)
