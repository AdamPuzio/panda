'use strict'

const PandaEventEmitter = require('./class/event-emitter')
const Utility = require('./utility')
const path = require('path')

/**
 * PandaCore
 */
class PandaCore extends PandaEventEmitter {
  /**
   * PandaCore constructor
   * 
   * @returns 
   */
  constructor () {
    if (PandaCore._instance) return PandaCore._instance
    super()
    PandaCore._instance = this

    this._projectDir = this.projectDirectory()
    this.debug(`Panda.Core initialized`)
  }

  VERSION = require('../package.json').version

  _projectDir = null

  /**
   * Returns the current version of Panda
   * @returns String
   */
  getVersion () {
    return this.VERSION
  }

  /**
   * Determine the base of the current working Project directory
   * 
   * @param {string} cwd 
   */
  projectDirectory (cwd) {
    if (this._projectDir) return this._projectDir
    if (!cwd) cwd = process.cwd()
    let cwdx = cwd
    let projectDir = null
  
    while (!projectDir) {
      const projectJsonExists = Utility.pathExistsSync(path.join(cwdx, 'project.json'))
      // if the app directory exists (or checkApp is false) and package.json exists
      if (projectJsonExists) projectDir = cwdx
      if (cwdx === path.dirname(cwdx)) {
        return false
      }
      cwdx = path.dirname(cwdx)
    }
  
    this.debug(`project directory located: ${projectDir}`)
    this._projectDir = projectDir
    return projectDir
  }

  /**
   * Retrieves package.json in JSON format
   * 
   * @returns Object
   */
  getPackageJson () {
    const file = path.join(this.projectDirectory(), 'package.json')
    const fileExists = Utility.pathExistsSync(file)
    if (!fileExists) return null
    return require(file)
  }

  /**
   * Retrieves project.json in JSON format
   * 
   * @returns Object
   */
  getProjectJson () {
    const file = path.join(this.projectDirectory(), 'project.json')
    const fileExists = Utility.pathExistsSync(file)
    if (!fileExists) return null
    return require(file)
  }
}

module.exports = new PandaCore()
