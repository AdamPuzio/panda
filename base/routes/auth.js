const Panda = require('../../')
const express = Panda.express
const passport = require('passport')
const jwt = require('jsonwebtoken')

const router = express.Router()

router.get('/login', async function (req, res, next) {
  // if user is already logged in, redirect them
  if(req.user) return res.redirect(Panda.cfg.authentication.login_redirect)
  res.render('pages/account/login', {})
})

router.post('/login', async function(req, res, next) {
  let params = JSON.parse(JSON.stringify(req.body))
  
  return passport.authenticate('local-auth', { session: false }, function(err, user, info) {
    if(err) return next(err)
    
    if(user) {
      Panda.Auth.setToken(null, user, res)
      return res.redirect(Panda.cfg.authentication.login_redirect)
    }
    
    return res.render('pages/account/login', {errors: [info], values: params})
  })(req, res, next)
})

router.get('/logout', async function(req, res, next) {
  res.clearCookie(Panda.cfg.session.cookie_name)
  res.redirect('/')
})

router.get('/register', async function (req, res, next) {
  if(req.user) return res.redirect('/')
  res.render('pages/account/register', {})
})

router.post('/register', async function(req, res, next) {
  let params = JSON.parse(JSON.stringify(req.body))
  try {
    let user = await req.broker.call('account.register', params)
    // check if confirmation is required
    if(Panda.cfg.authentication.registration_confirmation === true) {
      // if it is, send them to the login page
      return res.redirect('/login')
    } else {
      // if it isn't, log them in and send them to wherever they're supposed to go
      return passport.authenticate('local-auth', { session: false }, function(err, user, info) {
        if(err) return next(err)

        if(user) {
          Panda.Auth.setToken(null, user, res)
          return res.redirect(Panda.cfg.authentication.registration_redirect)
        }

        return res.render('pages/account/register', {errors: [info], values: params})
      })(req, res, next)
    }
  } catch (e) {
    console.log('ERROR OCCURRED')
    console.log(e)
    return res.render('pages/account/register', {errors: [e.message], values: params})
  }
})

module.exports = router