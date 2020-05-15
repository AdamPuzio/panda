'use strict'

const _ = require('lodash')
const Core = require('./core')
const path = require('path')
const fs = require('fs')


let defaultVals = {
  MONGO_URI: 'mongodb://localhost/panda',
  JWT_TOKEN: 'panda',
  
  APP_PATH: path.join(process.cwd(), 'app'),
  
  site: {
    name: 'Panda',
    desc: '',
    logo: null,
    includes: {
      header: {
        js: [],
        css: []
      },
      footer: {
        js: [],
        css: []
      }
    },
    nav: []
  }
}
let cfg = _.defaults({}, defaultVals)

let filePath
if (!filePath && fs.existsSync(path.resolve(process.cwd(), "panda.config.js"))) {
  filePath = path.resolve(process.cwd(), "panda.config.js")
}
if (!filePath && fs.existsSync(path.resolve(process.cwd(), "panda.config.json"))) {
  filePath = path.resolve(process.cwd(), "panda.config.json")
}

if(filePath) {
  let localCfg = {}
  const ext = path.extname(filePath);
  switch (ext) {
    case ".json":
    case ".js":
    case ".ts":
      const content = require(filePath)
      if (_.isFunction(content)) {
        localCfg = content.call(this)
      } else {
        localCfg = content
      }
    break
    default: 
      throw new Error(`Not supported file extension: ${ext}`)
  }
  cfg = _.merge(cfg, localCfg)
}

let envVars = _.pick(process.env, Object.keys(cfg))
cfg = _.merge(cfg, envVars)

var handler = {
  get: function(target, name){
    if(typeof name === 'symbol')
      return null
    if(!(name in target))
      target[name] = new Proxy({}, {
        get: function(target, name) {
          return undefined
        }
      })
    return target[name]
  },
  set (target, key, value) {
    return true
  }
}
module.exports = new Proxy(cfg, handler)