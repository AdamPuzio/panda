'use strict'

const _ = require('lodash')
const Core = require('./core')
const express = require('express')
const { ServiceBroker } = require('moleculer')
const path = require('path')
const util = require('util')
const glob = util.promisify(require('glob'))

/**
 * App class
 *
 * @class App
 */
class App {
  
}

App.app = function(opts = {}) {
  opts = _.defaultsDeep({
    
  }, opts)
  
  const app = this.express()
  const broker = this.createBroker()
  const svc = this.createWebService()
  
  app.broker = broker
  broker.app = app
  
  app.use('/api', svc.express())
  
  broker.start()
  
  return app
}

App.express = function() {
  const app = express()
  this._app = app
  
  return app
}

App.createBroker = function() {
  const broker = new ServiceBroker()
  
  return broker
}

App.createWebService = function(opts = {}) {
  opts = _.defaultsDeep({
    mixins: [ApiService],

    settings: {
      server: false
    }
  })
  const svc = broker.createService(opts)
  
  return svc
}

App.initRoutes = async function(app, routesDir) {
  let files = await glob(path.join(routesDir, '/**/*.js'))
  files.forEach(function(file) {
    let relpath = file.replace(routesDir, '')
    let p = path.dirname(relpath)
    app.use(p, require(file))
  })
  return
}

module.exports = App