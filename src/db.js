'use strict'

const cfg = require('./cfg')
const mongoose = require('mongoose')

const defaultOptions = {}

/**
 * Database class
 *
 * @class Database
 */
class Database {
  /**
   * Creates an instance of Core
   *
   * @param {Object} options - Initialization options
   */
  constructor () {
    mongoose.Promise = global.Promise
    let uri = cfg.MONGO_URI
    mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
    
    this.mongoose = mongoose
    this.model = mongoose.model
    this.ObjectId = mongoose.Types.ObjectId
  }
  
}

//Database.model = mongoose.model
//Database.ObjectId = mongoose.Types.ObjectId

const PandaDatabase = new Database()

module.exports = PandaDatabase
