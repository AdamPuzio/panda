const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Schema = mongoose.Schema

const UserSchema = new Schema({
  id: { type: "string", readonly: true, primaryKey: true, secure: true, columnName: "_id" },
  firstName: { type: "string", maxlength: 50, required: true },
  lastName: { type: "string", maxlength: 50, required: true },
  email: { type: "string", maxlength: 100, required: true },
  password: { type: "string", minlength: 5, maxlength: 60, hidden: true },
  //avatar: { type: "string" },
  //roles: { required: true },
  //socialLinks: { type: "object" },
  //status: { type: "number", default: 1 },
  //plan: { type: "string", required: true },
  //verified: { type: "boolean", default: false },
  //token: { type: "string", readonly: true },
  //resetTokenExpires: { hidden: true },
  //verificationToken: { hidden: true },
  createdAt: { type: "number", updateable: false, default: Date.now },
  updatedAt: { type: "number", readonly: true, updateDefault: Date.now },
  lastLoginAt: { type: "number" }
})

UserSchema.pre('save', async function(next){
  const user = this
  //Hash the password with a salt round of 10, the higher the rounds the more secure, but the slower
  //your application becomes.
  const hash = await bcrypt.hash(this.password, 10)
  //Replace the plain text password with the hash and then store it
  this.password = hash
  next();
})

UserSchema.methods.isValidPassword = async function(password){
  const user = this
  //Hashes the password sent by the user for login and checks if the hashed password stored in the
  //database matches the one sent. Returns true if it does else false.
  const compare = await bcrypt.compare(password, user.password)
  return compare
}

UserSchema.methods.generateJWT = function() {
  const today = new Date()
  const expirationDate = new Date(today)
  expirationDate.setDate(today.getDate() + 60)

  return jwt.sign({
    email: this.email,
    id: this._id,
    exp: parseInt(expirationDate.getTime() / 1000, 10),
  }, 'panda')
}

UserSchema.methods.toAuthJSON = function() {
  return {
    _id: this._id,
    email: this.email,
    token: this.generateJWT(),
  }
}

const UserModel = mongoose.model('user', UserSchema)

module.exports = UserModel