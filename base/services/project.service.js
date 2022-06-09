'use strict'

const Project = require('../../src/project')

module.exports = {
  name: 'project',
  actions: {

    shrinkwrap: {
      params: { },
      async handler (ctx) {
        const shrinkwrap = await Project.shrinkwrap()
        return shrinkwrap
      }
    }
  }
}
