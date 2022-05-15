const Panda = require('../../')
const path = require('path')

const scaffoldList = [
  { name: 'Basic (Wasp)', value: 'command/templates/wasp', default: true },
  { name: 'Basic (Commander)', value: 'command/templates/commander' }
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
      message: 'Description:',
      validate: async (val, answers) => {
        const check = val.length > 1
        return check || 'desc must be at least 2 letters'
      }
    },
    {
      type: 'list',
      name: 'scaffold',
      message: 'Command Type:',
      choices: function(answers) {
        return scaffoldList
      }
    }
  ],

  build: async (options, factory) => {
    const projectInfo = options.projectInfo

    // copy scaffolding file
    const dest = `app/commands/${projectInfo.slug}-${options.command}.js`
    await factory.copyTemplate(options.scaffold, dest, options)

    // determine the base command file for the project and create it if it doesn't exist
    const relBaseCmdFile = path.join('app', 'commands', `${projectInfo.slug}.js`)
    const baseCmdFile = path.join(factory.projectDir, relBaseCmdFile)
    const baseCmdExists = await Panda.Utility.pathExists(baseCmdFile)
    if (!baseCmdExists) {
      // base command file doesn't exist
      factory.logger.debug(`Creating ${baseCmdFile}...`)
      options._project = projectInfo
      await factory.copyTemplate ('command/templates/parent-command', relBaseCmdFile, options)
      await Panda.Utility.chmod(baseCmdFile, 0o755)

      // update package.json with bin and script values
      factory.logger.debug(`Updating package.json...`)
      const packageJson = await factory.readPackageJson()
      if (!packageJson.bin) packageJson.bin = {}
      if (!packageJson.bin[projectInfo.slug]) packageJson.bin[projectInfo.slug] = `./${relBaseCmdFile}`
      if (!packageJson.scripts) packageJson.scripts = {}
      if (!packageJson.scripts[projectInfo.slug]) packageJson.scripts[projectInfo.slug] = `./${relBaseCmdFile}`
      await factory.writePackageJson(packageJson)
    }

    // get the base command file and update it with the new command
    let content = await Panda.Utility.getFile(baseCmdFile)
    const replaceObj = { replace: '  .parse(process.argv)', with: `  .command('${options.command}', '${options.desc}')` + '\n  .parse(process.argv)'}
    content = content.replace(replaceObj.replace, replaceObj.with)
    return await Panda.Utility.setFile(baseCmdFile, content)
  }
}