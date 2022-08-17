'use strict'

const Entity = require('../class/entity')

class PandaStatic extends Entity {
  static type = 'static'

  static async register (buildObj, entityObj, pkg) {
    if (!buildObj.statics) buildObj.statics = []
    if (entityObj.statics) {
      const statics = await this.reduceAll(entityObj.statics, pkg)
      buildObj.statics = buildObj.statics.concat(statics)
    }
    return buildObj
  }
}

module.exports = PandaStatic