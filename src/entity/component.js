'use strict'

const Entity = require('../class/entity')

class PandaComponent extends Entity {
  static type = 'component'
  static filePattern = '/**/component.json'

  static async registerItem (buildObj, entity, pkg) {
    if (!buildObj.components) buildObj.components = []
    const cmp = require(entity.live)
    entity.name = cmp.name
    entity.namespace = cmp.namespace
    entity.config = cmp
    buildObj.components.push(entity)
  }
}

module.exports = PandaComponent