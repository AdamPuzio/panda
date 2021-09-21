const _ = require('lodash')
const Panda = require('panda')
//const { PandaError, PandaClientError, PageNotFoundError, ValidationError, UnauthorizedError, ForbiddenError } = require('panda').Errors

module.exports = {
  name: 'sample',
  
  mixins: [],
  
  settings: {},
  
  actions: {
    
    basic: {
      params: {
        value: { type: 'string', optional: true }
      },
      async handler(ctx) {
        let params = ctx.params
        let val = params.value
        
        return {
          value: val
        }
      }
    }
  },
  
  methods: {
    
  }
}