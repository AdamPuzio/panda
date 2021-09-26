'use strict'

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
  getLogger: require('./src/log').getLogger,

  VERSION: require('./src/core').VERSION
}
