#!/usr/bin/env node

const Panda = require('panda')
const packageJson = require('../../package.json')
const { Command, Option } = Panda.Wasp
const program = new Command()

program
  .description('<%-data._project.name%> CLI Tool')
  .version(packageJson.version, '-v, --version')
  // project commands
  .parse(process.argv)
