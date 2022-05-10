const Panda = require('../../')
const path = require('path')

const scaffoldList = [
  { name: 'Simple (Wasp)', value: 'command/templates/wasp-internal', default: true },
  { name: 'Scaffold (Wasp)', value: 'command/templates/wasp-internal-scaffold', applyEntity: true }
]

module.exports = {
  data: {
    scaffolds: scaffoldList
  },
  
  prompt: [
    {
      type: 'input',
      name: 'command',
      message: 'Command:',
      validate: async (val, answers) => {
        const check = val.length > 1 && /^[a-zA-Z0-9-_]+$/.test(val)
        return check || 'command must be at least 2 letters and alphanumeric (plus dash & underscore)'
      }
    },
    {
      type: 'input',
      name: 'desc',
      message: 'Description:'
    },
    {
      type: 'list',
      name: 'scaffold',
      message: 'Command Type:',
      default: 'command/templates/wasp-internal',
      choices: function(answers) {
        return scaffoldList
      }
    },
    {
      type: 'string',
      name: 'entity',
      message: 'Entity Type:',
      default: 'project',
      when: function(answers) {
        // only display when the matching item has 'applyEntity' param
        const selectedItem = scaffoldList.find(({ value }) => value === answers.scaffold)
        return selectedItem.applyEntity
      }
    }
  ],

  build: async (options, factory) => {
    const dest =  `panda-${options.command}.js`
    return await factory.copyTemplate(options.scaffold, dest, {...options, ...{ projectDir: path.join(Panda.PANDA_PATH, 'bin') }})
  }
}