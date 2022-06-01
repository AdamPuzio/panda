'use strict';

((a,b) => { process.env.PANDA_PATHS = (a || '').concat((a || '').split(';').find(e => e.startsWith(`${b}=`)) ? '' : `${b}=${require('path').dirname(__filename)};`) })(process.env.PANDA_PATHS, 'panda')

const PandaCore = require('panda-core')

let Logger

class Panda {
  constructor () {}

  Core = PandaCore

  ctx = PandaCore.ctx

  getLogger () {
    if (!Logger) Logger = require('./src/logger')
    return Logger
  }

  entity (entity) {
    return require(`./src/entity/${entity}`)
  }

  get Router () { return require('@koa/router') }

  get Wasp () { return PandaCore.Wasp }

  get Project () { return require('./src/project') }

  get Hub () { return require('./src/hub') }
}

module.exports = new Panda()