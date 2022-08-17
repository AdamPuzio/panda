'use strict'

const Entity = require('../class/entity')

/**
 * PandaView
 */
class PandaView extends Entity {
  static type = 'view'
  static filePattern = '/**/*.html'

  /**
   * Entity registration
   * 
   * @param {Object} buildObj build configuration object
   * @param {Object} entity entity definition
   * @param {Object} pkg (optional) package information
   * @returns {Object} updated build configuration object
   */
  static async registerItem (buildObj, entity, pkg) {
    const viewName = entity.relpath.replace('.html', '')
    entity.viewName = viewName
    if (pkg && pkg.package) entity.viewName = `${pkg.package}:${viewName}`

    if (!buildObj.views) buildObj.views = []
    buildObj.views.push(entity)
    return buildObj
  }
}

module.exports = PandaView