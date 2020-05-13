'use strict'

module.exports = {
  Core: require('./src/core'),
  App: require('./src/app'),
  Database: require('./src/db'),
  Utility: require('./src/utility'),
  Auth: require('./src/auth'),
  //Response: require('./src/response'),
  Errors: require('./src/errors'),
  
  //cfg: require('./src/core').cfg,
  cfg: require('./src/cfg'),
  
  model: require('./src/db').model,
  
  express: require('express'),

  VERSION: require('./src/core').VERSION
}
