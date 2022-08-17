'use strict'

const Entity = require('../class/entity')

class PandaService extends Entity {
  static type = 'service'
  static filePattern = '/**/*.service.js'

  static localMap = {
    project: {
      name: 'project',
      core: true,
      base: '{PANDA_PATH}',
      path: 'base/services/project.service.js'
    },
    component: {
      name: 'component',
      core: true,
      base: '{PANDA_PATH}',
      path: 'base/services/component.service.js'
    }
  }

  svcConfig = {}

  constructor (svc, svcConfig) {
    super()

    this.createConfig(svc, svcConfig)
  }

  createConfig (svc, svcConfig={}) {
    const cfg = {
      ...{
        name: svc,
        mixins: [],
        dependencies: [],
        settings: {},
        metadata: {},
        actions: {},
        methods: {},
        events: {},
        created () {},
        merged () {},
        async started () {},
        async stopped () {}
      },
      ...svcConfig
    }

    this.svcConfig = cfg
  }

  exportService () {
    return this.svcConfig
  }
}

module.exports = PandaService