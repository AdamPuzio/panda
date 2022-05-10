const mongoose = require('mongoose')

let Schema = mongoose.Schema

var <%- data.name %>Schema = new Schema({
  
})

var <%- data.name %> = mongoose.model('<%- data.name %>', <%- data.name %>Schema )