'use strict'

const Entity = require('../class/entity')

class PandaRoute extends Entity {
  static type = 'route'
  static filePattern = '/**/*.js'
}

module.exports = PandaRoute