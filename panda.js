'use strict'

const path = require('path')

const pandaDir = path.join(__dirname)
const baseDir = path.join(process.cwd())

module.exports = {
  Core: require('./src/core'),

  Logger: require('./src/log'),

  // Singletons
  Config: require('./src/cfg'),
  Errors: require('./src/errors'),
  PackageManager: require('./src/pkgmgr'),
  Utility: require('./src/util'),

  // Classes
  App: require('./src/app'),
  Package: require('./src/pkg'),

  // convenience functions & variables
  cfg: require('./src/cfg').cfg,
  getConfig: require('./src/cfg').getConfig,
  getLogger: require('./src/log').getLogger,
  getBroker: require('./src/core').getBroker,
  router: require('./src/app').router,

  PANDA_DIR: pandaDir,
  APP_PATH: baseDir,

  VERSION: require('./src/core').VERSION
}
