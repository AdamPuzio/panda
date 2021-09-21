'use strict'

const path = require('path')
const fs = require('fs')

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
  
  loadJsonFile: async function (filePath) {
    let content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return content
  }
}

module.exports = Utility