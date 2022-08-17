'use strict'

const Panda = require('../../')
const ctx = require('../context').ctx
const Logger = require('../logger')

class PandaProject {

  _project = {}
  _data = {}

  _entity = {}
  _entityMiddleware = []

  constructor (projectObj) {
    // init logger
    this.logger = Logger.getLogger('Project')
    // register the base entity types
    if (projectObj) this._project = projectObj
    const entityTypes = ['package', 'app', 'service', 'route', 'static', 'component', 'view']
    entityTypes.forEach(en => {
      this.registerEntityType(en)
    })
    this.logger.silly('initialize Project')
  }

  registerEntityType (name, entity) {
    if (!entity) entity = Panda.entity(name)
    const regFn = entity.registerItem.bind(entity)
    entity.registerFn = regFn
    this._entity[name] = entity
    this._entityMiddleware.push(entity.register.bind(entity))
    this._data[`${name}s`] = []
  }

  entity (en) {
    return this._entity[en]
  }

  /*async register (entity, item) {
    this._entity[entity].register(this._data, item)
  }*/

  async load (file) {
    file = this.tpl(file)
    const fileObj = require(file)
    this._project = fileObj
    await this.build(this._project)
  }

  async add (entity, item) {
    const entityObj = this.entity(entity)
    //const reg = await entityObj.registerFn(item)
    const reg = await entityObj.registerFn(this._data, item)
    //this._data[`${entity}s`].push(reg)
    this._project[`${entity}s`].push(reg)
  }

  async build (dataObj, pkg) {
    this.logger.silly('Project.build()')
    if (!dataObj) dataObj = this._project
    let buildObj = {}
    await Promise.all(this._entityMiddleware.map(async (fn) => {
      buildObj = await fn(buildObj, dataObj, pkg, this)
    }))
    Object.entries(buildObj).forEach(([k, v]) => {
      this._data[k] = (this._data[k] || []).concat(v)
    })
    return buildObj
  }

  info () {
    return this._data
  }

  tpl (str, data={}) {
    data = {
      ...ctx,
      ctx,
      data
    }
    str = str.replace(new RegExp('{', 'g'), '${')
    return new Function(...Object.keys(data), `return \`${str}\`;`)(...Object.values(data))
  }
}

module.exports = PandaProject