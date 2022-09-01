'use strict'

const _ = require('lodash')
const glob = require('util').promisify(require('glob'))
const { v4: uuidv4 } = require('uuid')
const moment = require('moment')
const clargs = require('command-line-args')
const chalk = require('chalk')

module.exports = {
  _,
  glob,
  
  merge: _.merge,

  methodMap (source, target, map) {
    // if it's an Array, make it an Object
    if (Array.isArray(map)) map = Object.assign({}, ...map.map((v) => ({ [v]: v })))
    Object.entries(map).forEach(([k, v]) => {
      // apply it
      if (source[k]) {
        target[v] = typeof source[k] === 'function' ? source[k].bind(target) : source[k]
      }
    })
    return target
  },

  now: async function (dateFormat) { return moment().format(dateFormat) },

  openBrowser (url) {
    require('child_process')
      .exec((process.platform
        .replace('darwin', '')
        .replace(/win32|linux/, 'xdg-') + 'open ' + url))
  },

  parseOptions (def, opts = {}) {
    opts = { ...{ partial: true, camelCase: true }, opts }
    return clargs(def, opts)
  },

  pick (obj, keys, prune = true) {
    // array means keys stay the same
    if (Array.isArray(keys)) {
      return Object.assign({}, ...keys.map(key => {
        return Object.prototype.hasOwnProperty.call(obj, key) || !prune ? { [key]: obj[key] } : {}
      }))
    }
    // object means we convert keys
    return Object.assign({}, ...Object.keys(keys).map((key, i, o) => {
      return Object.prototype.hasOwnProperty.call(obj, key) || !prune ? { [keys[key]]: obj[key] } : {}
    }))
  },

  promptList (arr) {
    const names = arr.map(a => a.name)
    const maxLength = Math.max.apply(Math, names.map(function (el) { return el.length }))
    const rs = []
    arr.forEach((i) => {
      const spacing = maxLength + 5 - i.name.length
      const spacer = ' '.repeat(spacing > 0 ? spacing : 0)
      const name = `${i.name}${spacer}${chalk.dim(i.desc) || ''}`
      rs.push({ name, value: i.value })
    })
    return rs
  },

  tpl (str, data={}) {
    str = str.replace(new RegExp('{', 'g'), '${')
    return new Function(...Object.keys(data), `return \`${str}\`;`)(...Object.values(data))
  },

  uuid: function () { return uuidv4() },

  slugify (v) { return _.kebabCase(v) }, // becomes-this
  nameify (v) { return _.startCase(v) }, // Becomes This
  camelify (v) { return _.camelCase(v) }, // becomesThis
  pascalify (v) { return _.upperFirst(_.camelCase(v)) }, // BecomesThis
  snakeify (v) { return _.snakeCase(v) }, // becomes_this
  envify (v) { return _.snakeCase(v).toUpperCase() }, // BECOMES_THIS,

  allify (v) {
    return {
      slug: _.kebabCase(v),
      name: _.startCase(v),
      camel: _.camelCase(v),
      pascal: _.upperFirst(_.camelCase(v)),
      snake: _.snakeCase(v),
      env: _.snakeCase(v).toUpperCase()
    }
  }
}
