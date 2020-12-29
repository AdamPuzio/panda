'use strict'

const _ = require('lodash')
const Core = require('./core')
const cfg = require('./cfg')
const path = require('path')
const ms = require('ms')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const { UnauthorizedError } = require('./errors')

/**
 * Auth class
 *
 * @class Auth
 */
class Auth {}

Auth.initPassport = async function(app, broker) {
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(this.middleware(app))
  
  let strategies = this.strategies
  passport.use('local-auth', strategies.localLogin(app))
  
  app.use(function(req, res, next) {
    req.broker = broker
    res.user = res.locals.user = req.user || null
    res.locals.site = cfg.site
    next()
  })
}

Auth.middleware = function(app) {
  let scope = this
  return async function(req, res, next) {
    const token = req.header('Access-Token') || req.cookies[cfg.session.cookie_name]
    try {
      if (!token) return next()

      try {
        const key = cfg.JWT_TOKEN
        const decrypt = await jwt.verify(token, key)
        let user = await app.broker.call('account.getUser', { email: decrypt.email })
        req.user = user
        
        scope.setToken(token, user, res)
      } catch(e) {
        console.log('ERROR WITH LOCAL AUTH')
        console.log(e)
      }
      next()
    } catch (err) {
      return res.status(500).json(err.toString())
    }
  }
}

Auth.setToken = async function(token, user, res) {
  if(!user || !res) return false
  let u = _.pick(user, ['_id', 'email'])
  if(!token) token = jwt.sign(u, cfg.JWT_TOKEN, { expiresIn: ms(cfg.session.token_expiration) })
  res.cookie(cfg.session.cookie_name, token, {
    expires: new Date(Date.now() + ms(cfg.session.idle_timeout))
  })
  return true
}

Auth.strategies = {}

Auth.strategies.localSignup = {}

Auth.strategies.localLogin = function(app) {
  return new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    //passReqToCallback : true
  }, async function (email, password, done) {
    try {
      let call = await app.broker.call('account.authenticate', { email: email, password: password })
      done(null, call)
    } catch(e) {
      done(null, null, {message: e.message})
    }
  })
}

Auth.auth = {}

Auth.auth.private = async function(req, res, next) {
  if(req.user) return next()
  
  next(new UnauthorizedError('Unauthorized'))
}

module.exports = Auth