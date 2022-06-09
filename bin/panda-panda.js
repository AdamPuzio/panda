#!/usr/bin/env node

const Panda = require('panda-core')
const Wasp = Panda.Wasp
const program = new Wasp.Command()

program
  .description('This what they all been waitin\' for')
  .option('--no-fun', 'I\'m no fun')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    cmd.logger.debug('command: panda')

    cmd.logger.out('green', 'Time to share my vibe right now...')

    const url = 'https://www.youtube.com/watch?v=E5ONTXHS2mM'

    Panda.Utility.openBrowser(url)
  })

program.parse(process.argv)
