'use strict'

const Entity = require('../class/entity')
const path = require('path')

class PandaPackage extends Entity {
  static type = 'package'
  
  constructor (baseObj) {
    super()
    //this.baseObj = baseObj
  }

  static async register (buildObj, entityObj, pkg, scope) {
    if (!buildObj.packages) buildObj.packages = []
    if (entityObj.packages) {
      await Promise.all(entityObj.packages.map(async (entity) => {
        if (!entity.path) entity.path = entity.package
        entity = this.reduce(entity)
        const requireFile = path.join(entity.live, 'package.json')
        const packageJson = require(requireFile)
        let importObj
        if (packageJson.panda) importObj = await scope.build(packageJson.panda, entity)
        buildObj.packages.push(entity)
      }))
    }
    return buildObj
  }
}

module.exports = PandaPackage