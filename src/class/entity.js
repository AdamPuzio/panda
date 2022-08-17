'use strict'

const Panda = require('../../')
const ctx = require('../context').ctx
const Logger = require('../logger')
const path = require('path')
const fs = require('fs-extra')
const glob = require('util').promisify(require('glob'))

/**
 * PandaEntity
 */
class PandaEntity {

  initialized = false
  static localMap = {}
  static filePattern = '/**/*.js'

  /**
   * PandaEntity constructor
   * 
   * @param {Object} initClass 
   */
  constructor (initClass) {
    this.initClass = initClass
    this.initialized = true

    this.logger = Logger.getLogger(this)
  }

  /**
   * Entity registration
   * 
   * @param {Object} buildObj build configuration object
   * @param {Object} entity object of entity definitions
   * @param {Object} pkg (optional) package information
   * @returns {Object} updated build configuration object
   */
  static async register (buildObj, entityObj, pkg) {
    const en = `${this.type}s`
    let itemList = []

    const items = entityObj[en] || []

    await Promise.all(items.map(async (entity) => {
      const custom = {}
      if (entity.app) custom.app = entity.app
      const epath = this.reduce(entity, pkg)
      const stat = await fs.lstat(epath.live)
      if (stat.isDirectory()) {
        const items = await this.parseDir(epath, this.filePattern, pkg, custom)
        itemList.push(...items)
      } else {
        itemList.push(entity)
      }
    }))

    await Promise.all(itemList.map(async (entity) => {
      await this.registerItem(buildObj, entity, pkg)
    }))

    return buildObj
  }

  /**
   * Entity item registration
   * 
   * @param {Object} buildObj build configuration object
   * @param {Object} entity entity definition
   * @param {Object} pkg (optional) package information
   * @returns {Object} updated build configuration object
   */
  static async registerItem (buildObj, entity, pkg) {
    const en = `${this.type}s`
    const _entity = entity
    if (typeof entity === 'string') entity = this.localMap[entity]
    if (entity && entity[this.type]) entity = {...this.localMap[entity[this.type]], ...entity}
    if (!entity) throw new Error(`Unable to register new ${en}: ${_entity}`)
    entity = this.reduce(entity, pkg)
    if (!buildObj[en]) buildObj[en] = []
    buildObj[en].push(entity)
    return buildObj
  }

  /**
   * Parse a directory for matching files
   * 
   * @param {String} item 
   * @param {String|Regex} regex 
   * @param {Object} pkg 
   * @param {Object} customObj 
   * @returns {Array} list of file objects
   */
  static async parseDir (item, regex, pkg={}, customObj={}) {
    const dir = this.tpl(typeof item === 'string' ? item : item.live)
    const files = await glob(path.join(dir, regex))

    const fileObj = []
    await Promise.all(files.map(async (f) => {
      let rel = f.replace(pkg.live, pkg.path || '')
      rel = rel.replace(item.live, item.path)
      const relpath = f.replace(dir, '').substring(1)
      fileObj.push({...{
        path: rel,
        live: f,
        relpath,
        pkg
      }, ...customObj})
    }))
    return fileObj
  }

  /**
   * Reduce a path object
   * 
   * @param {String|Object} pathObj the string or object to reduce
   * @param {Object} pkg package information
   * @returns {Object} the reduced path object
   */
  static reduce (pathObj, pkg={}) {
    if (typeof pathObj === 'string') pathObj = { path: pathObj }
    if (pathObj.base) {
      pathObj.path = path.join(pathObj.base, pathObj.path)
      delete pathObj.base
    }
    if (pkg.path) pathObj.path = pathObj.path.replace(new RegExp('\{PACKAGE_PATH\}', 'g'), pkg.path)
    pathObj.live = this.tpl(pathObj.path)
    if (pkg && pkg.package) pathObj.pkg = pkg
    return pathObj
  }

  /**
   * Reduce a list of path objects
   * 
   * @param {Array} list array of path objects
   * @param {Object} pkg packge information
   * @returns {Array} updated list of path objects
   */
  static async reduceAll (list, pkg) {
    return await Promise.all(list.map(async (entity) => {
      return this.reduce(entity, pkg)
    }))
  }

  /**
   * Apply template values to a string
   * 
   * @param {String} str the template string
   * @param {Object} data data object to use as values
   * @returns {String} updated string
   */
  static tpl (str, data={}) {
    data = {
      ...ctx,
      ctx,
      data
    }
    str = str.replace(new RegExp('{', 'g'), '${')
    return new Function(...Object.keys(data), `return \`${str}\`;`)(...Object.values(data))
  }

}

module.exports = PandaEntity
