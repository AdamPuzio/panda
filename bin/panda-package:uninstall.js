#!/usr/bin/env node

'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const Factory = Core.Factory
const program = new Wasp.Command()

program
  .description('Uninstall a Package')
  .argument('<pkg>', 'The Package to uninstall')
  .action(async function (pkg, opts, cmd) {
    this.debug('command: uninstall')

    this.heading('Uninstall a Package')

    // check to make sure we are in a Project directory
    await this.confirmInProject()

    await Factory.uninstallPackage(pkg, opts)
      .then((rs) => { this.success(`Successfully uninstalled ${pkg}`) })
      .catch((err) => { this.exitError(err) })
  })
  .parse(process.argv)
