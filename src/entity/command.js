'use strict'

const Hub = require('../hub')
const { Command } = require('commander')

class PandaCommand extends Command {
  constructor(name, customArg) {
    super(name)
    this.logger = Hub.getLogger('PandaCLI', {
      logFormat: 'cli',
      logLevel: 'info'
    })
  }
}

module.exports = PandaCommand