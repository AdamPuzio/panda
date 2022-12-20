'use strict';

((a, b) => { process.env.PANDA_PATHS = (a || '').concat((a || '').split(';').find(e => e.startsWith(`${b}=`)) ? '' : `${b}=${require('path').dirname(__filename)};`) })(process.env.PANDA_PATHS, 'panda')

const EventEmitter = require('events')
const Context = require('./src/context')
const Utility = require('./src/utility')

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

    // return a Proxy so we can fetch dynamic entities
    return new Proxy(this, {
      get(target, key, receiver) {
        if (Reflect.has(target, key, receiver))
          return Reflect.get(target, key)
        const entity = target.entity(key)
        if (entity) return entity
        return undefined
      }
    })
  }

  class = {
    Singleton: require('./src/class/singleton'),
    Entity: require('./src/class/entity')
  }

  get Context () { return Context }
  get Factory () { return require('./src/factory') }
  get Hub () { return require('./src/hub') }
  get Logger () { return require('./src/logger') }
  get Terminal () { return require('./src/terminal') }
  get Utility () { return Utility }

  get ctx () { return Context.ctx }

  get Router () { return require('@koa/router') }

  /**
   * Fetch an Entity by type
   * 
   * @param {String} entity the name of the entity type
   * @returns entity class
   */
  entity (entity) {
    const name = Utility.pascalify(entity)
    const slug = Utility.slugify(entity)
    if (!name in this._entities) return undefined
    if (this._entities[name] !== null) return this._entities[name]
    const ref = this._entities[name] = require(`./src/entity/${slug}`)
    return ref
  }

  _entities = {
    App: null,
    Command: null,
    Component: null,
    Package: null,
    Project: null,
    Route: null,
    Scaffold: null,
    Service: null,
    Static: null,
    View: null
  }

  /**
   * Cheap way to access dependencies
   * 
   * @returns {Object} list of modules
   */
  modules () {
    return {
      Koa: require('koa'),
      bodyParser: require('koa-bodyparser'),
      cors: require('@koa/cors'),
      serve: require('koa-static'),
      session: require('koa-session'),
      mount: require('koa-mount'),
      path: require('path'),
      render: require('./base/lib/koa-render'),

      chalk: require('chalk'),
      dotenv: require('dotenv'),
      ejs: require('ejs'),
      glob: require('glob'),
      inquirer: require('inquirer')
    }
  }
}

module.exports = new Panda()
