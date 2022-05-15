'use strict'

const path = require('path')

const pandaDir = path.join(__dirname)
const baseDir = require('./src/core').projectDirectory()

const Hub = require('./src/hub')

const Panda = {
  Hub,

  Core: require('./src/core'),
  Errors: require('./src/errors'),
  Factory: require('./src/factory'),
  Utility: require('./src/utility'),
  Wasp: require('./src/wasp'),

  configure: (ns) => { return Hub.configure(ns) },
  getLogger: (ns) => { return Hub.getLogger(ns) },

  PANDA_PATH: pandaDir,
  APP_PATH: baseDir,
  CWD: process.cwd(),

  VERSION: require('./src/core').VERSION
}

Panda.Foo = require('./src/foo')

module.exports = Panda