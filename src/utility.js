'use strict'

const path = require('path')
const fs = require('fs-extra')
const uuid = require('bson-objectid')
const _ = require('lodash')
const ejs = require('ejs')
const moment = require('moment')

const Utility = {
  pathExists: async (p) => { return await fs.pathExists(p) },
  pathExistsSync: (p) => { return fs.existsSync(p) },
  relPathExists: async (p) => { return await fs.pathExists(path.resolve(process.cwd(), p)) },
  readJson: async (p) => { return fs.readJson(p) },
  getFile: async function (filePath, type = 'utf8') { return await fs.readFile(filePath, type) },
  setFile: async function (filePath, content, opts = {}) { return await fs.writeFile(filePath, content, opts) },
  chmod: async function (file, perms=0o755) { return fs.chmodSync(file, perms) },

  templateSync: function (tpl, dataObj) {
    return ejs.render(tpl, dataObj)
  },

  template: async function (tpl, dataObj) {
    return ejs.render(tpl, dataObj)
  },

  compile: async function (tpl, opts={}) {
    return ejs.compile(tpl, opts)
  },

  now: async function (dateFormat) {
    const dateString = moment().format(dateFormat)
    return dateString
  },

  pick: function (obj, keys, prune=true) {
    // array means keys stay the same
    if (Array.isArray(keys)) return Object.assign({}, ...keys.map(key => {
      return obj.hasOwnProperty(key) || !prune ? { [key]: obj[key] } : {}
    }))
    // object means we convert keys
    return Object.assign({}, ...Object.keys(keys).map((key, i, o) => {
      return obj.hasOwnProperty(key) || !prune ? { [keys[key]]: obj[key] } : {}
    }))
  },

  uuid: function () {
    return uuid()
  },

  slugify: function (text) {
    return text
      .toString() // Cast to string
      .replace( /([a-z])([A-Z])/g, '$1-$2' ) // replace camelCase with dash
      .toLowerCase() // Convert the string to lowercase letters
      .normalize('NFD') // The normalize() method returns the Unicode Normalization Form of a given string.
      .trim() // Remove whitespace from both sides of a string
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
  },

  deslugify: function (text) {
    text = text.charAt(0).toUpperCase() + text.slice(1)
    text
      .replace(/(^\w|-\w)/g, c => c.toUpperCase())
      .replace(/-/g, '')
    return text
  },

  parseEnv () {
    const envs = ['LOG_LEVEL', 'LOG_FORMAT']
    const vars = {}
    envs.forEach((env) => { 
      const cam = _.camelCase(env.toLowerCase())
      if (process.env[env]) vars[cam] = process.env[env]
    })
    return vars
  },

  openBrowser (url) {
    require('child_process')
      .exec((process.platform
        .replace('darwin','')
        .replace(/win32|linux/,'xdg-') + 'open ' + url))
  }
}

module.exports = Utility