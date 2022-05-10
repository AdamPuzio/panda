const Panda = require('../../')

const scaffoldList = [
  {
    name: 'ES-6 Class',
    value: 'model/templates/es6-class',
    default: false
  },
  {
    name: 'Mongoose Model',
    value: 'model/templates/mongoose',
    default: true
  }
]

module.exports = {
  data: {
    scaffolds: scaffoldList
  },
  
  prompt: [
    {
      type: 'input',
      name: 'name',
      message: 'Model Name:',
      default: 'Example',
      validate: async (val, answers) => {
        const check = val.length > 1 && /^[a-zA-Z0-9-_]+$/.test(val)
        return check || 'model name must be at least 2 letters and alphanumeric (plus dash & underscore, no spaces)'
      }
    },
    {
      type: 'input',
      name: 'slug',
      message: 'Model Slug:',
      default: function (answers) {
        return Panda.Utility.slugify(answers.name)
      },
      validate: async (val, answers) => {
        const check = val === Panda.Utility.slugify(val)
        return check || 'slug must be lowercase and alphanumeric (plus dash & underscore, no spaces)'
      }
    },
    {
      type: 'list',
      name: 'scaffold',
      message: 'Model Type:',
      choices: scaffoldList
    }
  ],

  build: async (options, factory) => {
    // copy the model file
    const dest = `app/models/${options.slug}.js`
    return await factory.copyTemplate(options.scaffold, dest, options)
  }
}