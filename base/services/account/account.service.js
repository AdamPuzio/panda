const _ = require('lodash')
const { PandaError, PandaClientError, PageNotFoundError, ValidationError, UnauthorizedError, ForbiddenError } = require('../../../').Errors
const UserModel = require('./models/user')
const bcrypt = require('bcrypt')

module.exports = {
  name: 'account',
  
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
        
        if(params.passwordConfirm && params.passwordConfirm !== params.password)
          throw new PandaClientError('Passwords do not match', 400, 'ERR_PASSWORD_MISMATCH')
        
        let found = await this.getUserByEmail(params.email)
        if (found)
          throw new PandaClientError("Email has already been registered.", 400, "ERR_EMAIL_EXISTS")
        
        let entity = _.pick(params, ['email', 'firstName', 'lastName', 'password'])
        const user = await UserModel.create(entity)
        
        return user
      }
    },
    
    authenticate: {
      params: {
        email: { type: "string", optional: false },
        password: { type: "string", optional: true },
        token: { type: "string", optional: true }
      },
      async handler(ctx) {
        const user = await this.getUserByEmail(ctx.params.email)
        
        if (!user)
          throw new PandaClientError('User Not Found', 400, "ERR_USER_NOT_FOUND")
        
        if (!(await bcrypt.compare(ctx.params.password, user.password)))
          throw new PandaClientError('Incorrect Password', 400, "ERR_WRONG_PASSWORD")
        
        return user
      }
    },
    
    getUser: {
      params: {
        email: { type: "string", optional: false }
      },
      async handler(ctx) {
        let user = await this.getUserByEmail(ctx.params.email)
        if(user && user.password) user.password = undefined
        return user
      }
    },
    
    getUserById: {
      params: {
        id: { type: "string", optional: false }
      },
      async handler(ctx) {
        let user = await this.getUserById(ctx.params.id)
        return user
      }
    }
  },
  
  methods: {
    getUserByEmail: async function(email) {
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
      let query = { _id: ObjectId(id) }
      try {
        let user = await UserModel.findOne(query)
        return user
      } catch (e) {
        console.log(e)
        throw new PandaClientError("Unknown User error", 400, "ERR_USER_UNKNOWN")
      }
    }
  }
}