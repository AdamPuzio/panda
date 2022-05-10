#!/usr/bin/env node

const Wasp = require('../src/wasp')
const program = new Wasp.Command()

program
  .description(`This what they all been waitin' for`)
  .option('--no-fun', 'I\'m no fun')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.out('Time to share my vibe right now...', 'green')

    const url = 'https://www.youtube.com/watch?v=E5ONTXHS2mM'

    require('child_process')
      .exec((process.platform
        .replace('darwin','')
        .replace(/win32|linux/,'xdg-') + 'open ' + url))
  })

program.parse(process.argv)