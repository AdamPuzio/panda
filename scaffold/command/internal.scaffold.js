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
    },
    {
      type: 'list',
      name: 'binadd',
      message: 'Add to bin/panda.js?',
      choices: [
        { name: 'Yes, as a Panda command', value: 'yes-panda'},
        { name: 'Yes, as a hidden command', value: 'yes-hidden' },
        { name: 'No', value: 'no' }
      ]
    }
  ],

  build: async (options, factory) => {
    const binDir = path.join(Panda.PANDA_PATH, 'bin')
    const dest =  `panda-${options.command}.js`
    await factory.copyTemplate(options.scaffold, dest, {...options, ...{ projectDir: binDir }})
    const replaceObj = {
      'yes-panda': { replace: '  // internal commands', with: `  .command('${options.command}', '${options.desc}')` + '\n  // internal commands'},
      'yes-hidden': { replace: '  .parse(process.argv)', with: `  .command('${options.command}', '${options.desc}', { hidden: true })` + '\n  .parse(process.argv)'}
    }
    if (replaceObj[options.binadd]) {
      const pandaCmdFile = path.join(binDir, 'panda.js')
      let content = await Panda.Utility.getFile(pandaCmdFile)
      content = content.replace(replaceObj[options.binadd].replace, replaceObj[options.binadd].with)
      return await Panda.Utility.setFile(pandaCmdFile, content)
    }
    return
  }
}