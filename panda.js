'use strict'

module.exports = {
  Core: require('./src/core'),
  App: require('./src/app'),
  Database: require('./src/db'),
  Utility: require('./src/utility'),
  Auth: require('./src/auth'),
  Errors: require('./src/errors'),
  
  cfg: require('./src/cfg'),
  
  model: require('./src/db').model,
  ObjectId: require('./src/db').ObjectId,
  
  express: require('express'),
  app: require('./src/app').app,
  
  call: require('./src/app').call,

  VERSION: require('./src/core').VERSION
}
