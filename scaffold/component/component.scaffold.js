const Panda = require('../../')

const scaffoldList = [
  {
    name: 'Basic',
    value: 'component/templates/basic',
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
      message: 'Component Name:',
      default: 'Panda Component',
      validate: async (val, answers) => {
        const check = val.length > 1 && /^[a-zA-Z0-9-_ ]+$/.test(val)
        return check || 'model name must be at least 2 letters and alphanumeric (plus dash & underscore)'
      }
    },
    {
      type: 'input',
      name: 'slug',
      message: 'Component Slug:',
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
      message: 'Component Type:',
      choices: scaffoldList
    }
  ], 

  build: async (options, factory) => {
    // copy the component file
    const dest = `app/ui/components/${options.slug}`
    return await factory.copy(options.scaffold, dest, options)
  }
}