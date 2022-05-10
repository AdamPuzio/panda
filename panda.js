'use strict'

const path = require('path')

const pandaDir = path.join(__dirname)
const baseDir = require('./src/core').determineProjectDirectory()

module.exports = {
  Core: require('./src/core'),

  Logger: require('./src/log'),

  // Singletons
  Config: require('./src/cfg'),
  Errors: require('./src/errors'),
  Factory: require('./src/factory'),
  PackageManager: require('./src/pkgmgr'),
  Utility: require('./src/util'),
  Wasp: require('./src/wasp'),

  // Classes
  App: require('./src/app'),
  Package: require('./src/pkg'),

  // convenience functions & variables
  cfg: require('./src/cfg').cfg,
  getConfig: require('./src/cfg').getConfig,
  getLogger: require('./src/log').getLogger,
  getBroker: require('./src/core').getBroker,
  router: require('./src/app').router,

  PANDA_PATH: pandaDir,
  APP_PATH: baseDir,
  CWD: process.cwd(),

  VERSION: require('./src/core').VERSION
}
