'use strict'

const PandaEventEmitter = require('./class/event-emitter')
const Hub = require('./hub')
const Utility = require('./utility')
const Factory = require('./factory')
const PandaCommand = require('./entity/command')
const Commander = require('commander')
const path = require('path')


class Wasp extends PandaEventEmitter {
  constructor () {
    if (Wasp._instance) return Wasp._instance
    super()
    Wasp._instance = this

    // let's set up some convenience classes/methods
    this.Commander = Commander
    this.Command = PandaCommand
    this.Option = Commander.Option
    this.Factory = Factory

    this.debug(`Panda.Wasp initialized`)
  }

  parse (cmd) {
    return this.Factory.parse(cmd)
  }
}

module.exports = new Wasp()
