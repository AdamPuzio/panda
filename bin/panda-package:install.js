#!/usr/bin/env node

'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const Factory = Core.Factory
const program = new Wasp.Command()

program
  .description('Install a new Package')
  .argument('<pkg>', 'The Package to install')
  .action(async function (pkg, opts, cmd) {
    this.debug('command: install')

    this.heading('Install a new Package')

    // check to make sure we are in a Project directory
    await this.confirmInProject()

    await Factory.installPackage(pkg, opts)
      .then((rs) => { this.success(`Successfully installed ${rs.name}`) })
      .catch((err) => { this.exitError(err) })
  })
  .parse(process.argv)
