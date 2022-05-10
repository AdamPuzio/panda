const Panda = require('../../')

const scaffoldList = [
  {
    name: 'Service',
    value: 'service/templates/service',
    default: true
  },
  {
    name: 'App',
    value: 'service/templates/app',
    requiresPort: true
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
      message: 'Service Name:',
      default: 'Example',
      validate: async (val, answers) => {
        const check = val.length > 1 && /^[a-zA-Z0-9-_ ]+$/.test(val)
        return check || 'project name must be at least 2 letters and alphanumeric (plus dash & underscore, no spaces)'
      }
    },
    {
      type: 'input',
      name: 'slug',
      message: 'Service Slug:',
      default: function (answers) {
        return Panda.Utility.slugify(answers.name)
      },
      validate: async (val, answers) => {
        return val === Panda.Utility.slugify(val)
      }
    },
    {
      type: 'list',
      name: 'scaffold',
      message: 'Service Type:',
      choices: scaffoldList
    },
    {
      type: 'number',
      name: 'port',
      message: 'Port:',
      default: 5050,
      when: function(answers) {
        // only display when the matching item has 'requiresPort' param
        const selectedItem = scaffoldList.find(({ value }) => value === answers.scaffold)
        return selectedItem.requiresPort
      }
    }
  ], 

  build: async (options, factory) => {
    // copy the service file
    const dest = `app/services/${options.slug}.js`
    return await factory.copyTemplate(options.scaffold, dest, options)
  }
}