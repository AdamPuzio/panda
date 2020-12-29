const _ = require('lodash')
const Panda = require('panda')
const { PandaError, PandaClientError, PageNotFoundError, ValidationError, UnauthorizedError, ForbiddenError } = require('panda').Errors
const UserModel = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cfg = Panda.cfg
const ms = require('ms')

module.exports = {
  name: 'auth-strategy-local',
  
  mixins: [],
  
  settings: {
    
  },
  
  actions: {
    
    register: {
      params: {
        email: { type: "email", optional: false },
        password: { type: "string", min: 5, optional: false },
        passwordConfirm: { type: "string", optional: false },
        firstName: { type: "string", min: 2 },
        lastName: { type: "string", min: 2 },
      },
      async handler(ctx) {
        const params = Object.assign({}, ctx.params)
        
        if(!params.passwordConfirm || params.passwordConfirm !== params.password)
          throw new PandaClientError('Passwords do not match', 400, 'ERR_PASSWORD_MISMATCH')
        
        let found = await this.getUserByEmail(params.email)
        if (found)
          throw new PandaClientError("Email has already been registered.", 400, "ERR_EMAIL_EXISTS")
        
        let entity = _.pick(params, ['email', 'firstName', 'lastName', 'password'])
        const user = await UserModel.create(entity)
        
        return user
      }
    },
    
    login: {
      params: {
        username: { type: 'string', optional: false },
        //email: { type: "string", optional: false },
        password: { type: "string", optional: true },
        //token: { type: "string", optional: true }
      },
      async handler(ctx) {
        const user = await this.getUserByEmail(ctx.params.username)
        
        if (!user)
          throw new PandaClientError('User Not Found', 400, "ERR_USER_NOT_FOUND")
        
        if (!(await bcrypt.compare(ctx.params.password, user.password)))
          throw new PandaClientError('Incorrect Password', 400, "ERR_WRONG_PASSWORD")
        
        let token = await this.generateToken(user)
        
        return {user, token}
      }
    },
    
    verify: {
      params: {
        token: { type: 'string', optional: false }
      },
      async handler(ctx) {
        const key = cfg.JWT_TOKEN
        const token = ctx.params.token
        
        try {
          const decrypt = await jwt.verify(token, key)
          //let user = await Panda.call('account.getUser', { email: decrypt.email })
          let user = await this.getUserById(decrypt._id)
          return user
        } catch(e) {
          throw new PandaClientError('User Not Found', 400, "ERR_USER_NOT_FOUND")
        }
      }
    }
    
  },
  
  methods: {
    getUserByEmail: async function(email) {
      //const UserModel = Panda.model('User')
      let query = { email: email }
      try {
        let user = await UserModel.findOne(query)
        return user
      } catch (e) {
        console.log(e)
        throw new PandaClientError("Unknown User error", 400, "ERR_USER_UNKNOWN")
      }
    },
    
    getUserById: async function(id) {
      try {
        let query = { _id: Panda.ObjectId(id) }
        let user = await UserModel.findOne(query)
        return user
      } catch (e) {
        console.log(e)
        throw new PandaClientError("Unknown User error", 400, "ERR_USER_UNKNOWN")
      }
    },
    
    generateToken: async function(user) {
      //let u = _.pick(user, ['_id', 'email'])
      let u = _.pick(user, ['_id'])
      let token = jwt.sign(u, cfg.JWT_TOKEN, { expiresIn: ms(cfg.session.token_expiration) })
      return token
    }
  }
}