const Panda = require('../../')

const scaffoldList = [
  {
    name: 'Skeleton',
    value: 'route/templates/skeleton',
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
      name: 'route',
      message: 'Route (e.g. admin or path/to/route):',
      default: 'route/templates/skeleton'
    },
    {
      type: 'list',
      name: 'scaffold',
      message: 'Route Type:',
      choices: function(answers) {
        return scaffoldList
      }
    }
  ],

  build: async (options, factory) => {
    // copy the route file
    const dest = `app/routes/${options.route}.js`
    return await factory.copyTemplate(options.scaffold, dest, options)
  }
}