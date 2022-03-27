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

  template: async function (tpl, dataObj) {
    return ejs.render(tpl, dataObj)
  },

  now: async function (dateFormat) {
    const dateString = moment().format(dateFormat)
    return dateString
  },

  generateId: async function (input) {
    const id = bsonObjectId()
    return id
  }
}

module.exports = Utility
