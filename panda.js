'use strict';

((a, b) => { process.env.PANDA_PATHS = (a || '').concat((a || '').split(';').find(e => e.startsWith(`${b}=`)) ? '' : `${b}=${require('path').dirname(__filename)};`) })(process.env.PANDA_PATHS, 'panda')

const EventEmitter = require('events')
let Logger

class Panda extends EventEmitter {
  constructor () {
    if (Panda._instance) return Panda._instance
    super()
    Panda._instance = this

    this.Core = require('panda-core')
  }

  getLogger () {
    if (!Logger) Logger = require('./src/logger')
    return Logger
  }

  entity (entity) {
    return require(`./src/entity/${entity}`)
  }

  get Router () { return require('@koa/router') }

  get Project () { return require('./src/project') }

  get Hub () { return require('./src/hub') }
}

module.exports = new Panda()
