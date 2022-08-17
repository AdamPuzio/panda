'use strict'

//const Project = require('../../src/entity/project')
const Hub = require('../../src/hub')

module.exports = {
  name: 'project',
  actions: {

    shrinkwrap: {
      params: { },
      async handler (ctx) {
        const shrinkwrap = Hub.info()
        return shrinkwrap
      }
    }
  }
}
