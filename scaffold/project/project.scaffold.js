const Panda = require('../../')
const path = require('path')

const projectScaffoldList = [
  { name: 'Web Application', value: 'webapp', default: true },
  { name: 'API (Coming Soon)', value: 'api', disabled: true },
  { name: 'Headless API (Coming Soon)', value: 'headless', disabled: true }
]

const scaffoldList = {
  webapp: [
    { name: 'Skeleton', value: 'project/templates/skeleton', default: true },
    { name: 'Full Sample Site', value: 'project/templates/full-site' },
    { name: 'React', value: 'project/templates/react' }
  ],
  api: null,
  headless: null
}

module.exports = {
  data: { scaffolds: scaffoldList },
  
  prompt: [
    {
      type: 'input',
      name: 'name',
      message: 'Project Name:',
      default: 'PandaProject',
      validate: async (val, answers) => {
        const check = val.length > 1 && /^[a-zA-Z0-9-_ ]+$/.test(val)
        return check || 'project name must be at least 2 letters and alphanumeric (plus dash & underscore, no spaces)'
      }
    },
    {
      type: 'input',
      name: 'slug',
      message: 'Project Slug:',
      default: function (answers) {
        return Panda.Utility.slugify(answers.name)
      },
      validate: async (val, answers) => {
        const check = val.length > 1 && /^[a-zA-Z0-9-_]+$/.test(val) && val === Panda.Utility.slugify(val)
        return check || 'project slug must be at least 2 letters and alphanumeric (plus dash & underscore, no spaces)'
      }
    },
    {
      type: 'list',
      name: 'projectScaffold',
      message: 'Project Type:',
      choices: projectScaffoldList
    },
    {
      type: 'list',
      name: 'scaffold',
      message: 'Project Scaffold:',
      when: function(answers) {
        return scaffoldList[answers.projectScaffold]
      },
      choices: function(answers) {
        return scaffoldList[answers.projectScaffold]
      }
    },
    // tools & utilities
    {
      type: 'list',
      name: 'testTool',
      message: 'Testing Framework',
      choices: [
        { name: '--none--', value: null },
        { name: 'Jest', value: 'jest' },
        { name: 'Mocha', value: 'mocha' }
      ]
    },
    {
      type: 'list',
      name: 'buildTool',
      message: 'Build Tool',
      choices: [
        { name: '--none--', value: null },
        { name: 'Webpack', value: 'webpack' },
        { name: 'Gulp', value: 'gulp' },
        { name: 'Grunt', value: 'grunt' }
      ]
    },
    {
      type: 'list',
      name: 'cssTool',
      message: 'CSS Preprocessor',
      choices: [
        { name: '--none--', value: null },
        { name: 'SASS', value: 'sass' },
        { name: 'LESS', value: 'less' }
      ]
    },
    {
      type: 'list',
      name: 'lintTool',
      message: 'Linter',
      choices: [
        { name: '--none--', value: null },
        { name: 'JSLint', value: 'jslint' },
        { name: 'ESLint', value: 'eslint' },
        { name: 'StandardJS', value: 'standard' },
        { name: 'JSHint', value: 'jshint' }
      ]
    }
  ],

  build: async (options, factory) => {
    const dest = options.slug
    
    await factory.copy(options.scaffold, dest, options)

    let popts = {...{}, ...Panda.Utility.pick(options, ['name', 'slug', 'testTool', 'buildTool', 'cssTool', 'lintTool'])}
    const projectDir = path.join(process.cwd(), dest)
    await factory.buildPackageJson(projectDir, popts)
    await factory.buildProjectJson(projectDir, popts)

    const tools = ['testTool', 'buildTool', 'cssTool', 'lintTool']
    tools.forEach(async(tool) => {
      if (options[tool]) await factory.npmInstallPackage(options[tool], projectDir, true)
    })
    return
  }
}