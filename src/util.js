'use strict'

const path = require('path')
const fs = require('fs')
const moment = require('moment')
const bsonObjectId = require('bson-objectid')
const ejs = require('ejs')

const Utility = {
  dirExists: async function (file) {
    return fs.existsSync(file)
  },

  fileExists: async function (file) {
    return fs.existsSync(file)
  },

  fileExistsSync: function (file) {
    return fs.existsSync(file)
  },

  relFileExists: async function (file) {
    return await Utility.fileExists(path.resolve(process.cwd(), file))
  },

  getFile: async function (filePath, type = 'utf8') {
    const content = fs.readFileSync(filePath, 'utf8')
    return content
  },

  setFile: async function (filePath, content, opts = {}) {
    opts = Object.assign({}, opts)
    try {
      fs.writeFileSync(filePath, content, opts)
      return true
    } catch (err) {
      return false
    }
  },

  loadJsonFile: async function (filePath) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      return content
    } catch (err) {
      return false
    }
  },

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

  generateId: async function (input) {
    const id = bsonObjectId()
    return id
  },

  pick: function (obj, keys) {
    return Object.assign({}, ...keys.map(key => ({ [key]: obj[key] })))
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
  }
}

module.exports = Utility
