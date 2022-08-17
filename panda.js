'use strict';

((a, b) => { process.env.PANDA_PATHS = (a || '').concat((a || '').split(';').find(e => e.startsWith(`${b}=`)) ? '' : `${b}=${require('path').dirname(__filename)};`) })(process.env.PANDA_PATHS, 'panda')

const EventEmitter = require('events')
const Context = require('./src/context')

/**
 * Panda
 */
class Panda extends EventEmitter {
  /**
   * Panda constructor
   */
  constructor () {
    if (Panda._instance) return Panda._instance
    super()
    Panda._instance = this

    this.Panda = this

    // emit init
    this.emit('init', this)
  }

  class = {
    Singleton: require('./src/class/singleton'),
    Entity: require('./src/class/entity')
  }

  get Context () { return Context }
  get Hub () { return require('./src/hub') }
  get Logger () { return require('./src/logger') }
  get Terminal () { return require('./src/terminal') }
  get Utility () { return require('./src/utility') }

  get ctx () { return Context.ctx }

  get Router () { return require('@koa/router') }

  /**
   * 
   * @param {String} entity the name of the entity
   * @returns entity class
   */
  entity (entity) {
    return require(`./src/entity/${entity}`)
  }
}

module.exports = new Panda()
