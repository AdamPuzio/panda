'use strict'

const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const express = require('express')

const defaultOptions = {}

/**
 * Core class
 *
 * @class Core
 */
class Core {
  /**
   * Creates an instance of Core
   *
   * @param {Object} options - Initialization options
   */
  constructor (options) {
    try {
      this.options = Object.assign({}, defaultOptions, options)
    } catch (err) {
      console.log('Unable to create Core', err)
    }
  }
  
}

Core.VERSION = require('../package.json').version
Core.prototype.VERSION = Core.VERSION

const PandaCore = new Core()

module.exports = PandaCore
