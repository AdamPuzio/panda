#!/usr/bin/env node

const Panda = require('../')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description(`This what they all been waitin' for`)
  .option('--no-fun', 'I\'m no fun')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    cmd.logger.debug(`command: panda`)
    let options = Wasp.parse(cmd)

    cmd.logger.out('Time to share my vibe right now...', 'green')

    const url = 'https://www.youtube.com/watch?v=E5ONTXHS2mM'

    Panda.Utility.openBrowser(url)
  })

program.parse(process.argv)