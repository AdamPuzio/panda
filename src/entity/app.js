'use strict'

const Entity = require('../class/entity')

/**
 * PandaApp
 */
class PandaApp extends Entity {
  static type = 'app'

  static localMap = {
    web: {
      name: 'web',
      core: true,
      base: '{PANDA_PATH}',
      path: 'base/apps/web.app.js'
    },
    api: {
      name: 'api',
      core: true,
      base: '{PANDA_PATH}',
      path: 'base/apps/api.app.js'
    }
  }
  
  constructor () {
    super()
  }

  /**
   * Entity registration
   * 
   * @param {Object} buildObj build configuration object
   * @param {Object} entity entity definition
   * @param {Object} pkg (optional) package information
   * @returns {Object} updated build configuration object
   */
  static async register (buildObj, entityObj, pkg) {
    const map = this.localMap
    if (!buildObj.apps) buildObj.apps = []
    if (entityObj.apps) {
      await Promise.all(entityObj.apps.map(async (entity) => {
        if (!entity.path && map[entity.app]) entity = {...map[entity.app], ...entity}
        entity = this.reduce(entity, pkg)
        if (!entity.name) entity.name = entity.app
        
        buildObj.apps.push(entity)
      }))
    }
    return buildObj
  }
}

module.exports = PandaApp