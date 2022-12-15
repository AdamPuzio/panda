'use strict'

/*
* Helper functionality for Scaffold scaffolding
*/
const Factory = require('../../factory')
const Utility = require('../../utility')
const path = require('path')

// converts name/desc/value object to a table for lists
function tableFn (arr, cfg={}) {
  cfg = {...{
    nameField: 'name',
    descField: 'desc',
    valueField: 'value'
  }, ...cfg}
  const names = arr.map(a => a[cfg.nameField])
  const maxLength = Math.max.apply(Math, names.map(function (el) { return el.length }))
  const rs = []
  arr.forEach((i) => {
    const spacing = maxLength + 5 - i[cfg.nameField].length
    const spacer = ' '.repeat(spacing > 0 ? spacing : 0)
    const name = `${i[cfg.nameField]}${spacer}${i[cfg.descField] || ''}`
    rs.push({ name, value: i[cfg.valueField] })
  })
  return rs
}

// list of useful regular expressions
const regex = {}

// questions for interface
const questions = {

  // basic input for command name
  command: (cfg={}) => {
    return {...{
      type: 'input',
      name: 'command',
      message: 'Command:',
      validate: async (val, answers) => {
        const check = val.length > 1 && /^[a-zA-Z0-9-:_]+$/.test(val)
        return check || 'command must be at least 2 letters and alphanumeric (plus dash, underscore or colon; no spaces or special characters)'
      }
    }, ...cfg}
  },

  // yes/no to add an in-project check
  confirmInProject: (cfg={}) => {
    return {...{
      type: 'confirm',
      name: 'confirmInProject',
      message: 'Add in-Project check?'
    }, ...cfg}
  },

  // simple text description
  desc: (cfg={}) => {
    return {...{
      type: 'input',
      name: 'desc',
      message: 'Description:'
    }, ...cfg}
  },

  // pretty display name
  displayName: (cfg={}) => {
    return {...{
      type: 'input',
      name: 'displayName',
      message: 'Display Name:'
    }, ...cfg}
  },

  // entity type
  entity: (cfg={}) => {
    return {...{
      type: 'list',
      name: 'entity',
      message: 'Entity Type:',
      choices: [
        { name: 'App', value: 'app' },
        { name: 'Command', value: 'command' },
        { name: 'Component', value: 'component' },
        { name: 'Model', value: 'model' },
        { name: 'Package', value: 'package' },
        { name: 'Project', value: 'project' },
        { name: 'Route', value: 'route' },
        { name: 'Scaffold', value: 'scaffold' },
        { name: 'Service', value: 'service' },
        { name: 'View', value: 'view' },
      ]
    }, ...cfg}
  },

  // filepath relative to base
  filepath: (cfg={}) => {
    return {...{
      type: 'input',
      name: 'filepath',
      message: 'File Path:',
      default: 'app/'
    }, ...cfg}
  },

  // simple name/slug
  name: (cfg={}) => {
    return {...{
      type: 'input',
      name: 'name',
      message: 'Name:',
      validate: async (val, answers) => {
        const check = val.length > 1 && /^[a-zA-Z0-9-_]+$/.test(val) && val === Utility.slugify(val)
        return check || 'project name must be at least 2 letters and alphanumeric (plus dash & underscore, no spaces or special characters)'
      }
    }, ...cfg}
  },

  // namespace
  namespace: (cfg={}) => {
    return {...{
      type: 'input',
      name: 'namespace',
      message: 'Namespace',
      default: function (answers) {
        const packageJson = Factory.readPackageJsonSync(null, { onFail: 'empty' })
        return [
          packageJson.name,
          'scaffolds',
          answers.entity,
          answers.name
        ].join('.')
      }
    }, ...cfg}
  },

  // find a list of commands in package.json bin
  parentCommand: (cfg={}) => {
    return {...{
      type: 'list',
      name: 'parentCommand',
      message: 'Parent Command:',
      when: function (answers) {
        const packageJson = Factory.readPackageJsonSync(null, { onFail: 'empty' })
        const keys = Object.keys(packageJson.bin || {})
        if (keys.length === 0) throw new Error('No primary command found in package.json')
        if (keys.length === 1) answers.parentCommand = keys[0]
        return keys.length > 1
      },
      choices: function (answers) {
        const packageJson = Factory.readPackageJsonSync(null, { onFail: 'empty' })
        const bin = []
        Object.keys(packageJson.bin).forEach(k => {
          bin.push({
            name: k,
            value: k
          })
        })
        return bin
      }
    }, ...cfg}
  },

  // port
  port: (cfg={}) => {
    return {...{
      type: 'input',
      name: 'port',
      message: 'Port:',
      default: 5000,
      validate: async (val, answers) => {
        const test = /^\d+$/.test(val)
        if (test) answers.port = parseInt(val)
        return test
      }
    }, ...cfg}
  },

  // template (must provide choices)
  template: (cfg={}) => {
    if (cfg.choices) cfg.choices = tableFn(cfg.choices)
    return {...{
      type: 'list',
      name: 'template',
      message: 'Template:',
      choices: [
        { name: 'No templates available', value: null }
      ],
      when: function (answers) {
        if (!cfg.choices) return false
        if (cfg.choices.length === 1){
          answers[cfg.name || 'template'] = cfg.choices[0].value
          return false
        }
        return true
      }
    }, ...cfg}
  },

  testTool: (cfg={}) => {
    return {...{
      type: 'list',
      name: 'testTool',
      message: 'Testing Framework',
      choices: [
        { name: '--none--', value: null },
        { name: 'Jest', value: 'jest' },
        { name: 'Mocha', value: 'mocha' }
      ]
    }, ...cfg}
  },

  buildTool: (cfg={}) => {
    return {...{
      type: 'list',
      name: 'buildTool',
      message: 'Build Tool',
      choices: [
        { name: '--none--', value: null },
        { name: 'Webpack', value: 'webpack' },
        { name: 'Gulp', value: 'gulp' },
        { name: 'Grunt', value: 'grunt' }
      ]
    }, ...cfg}
  },

  cssTool: (cfg={}) => {
    return {...{
      type: 'list',
      name: 'cssTool',
      message: 'CSS Preprocessor',
      choices: [
        { name: '--none--', value: null },
        { name: 'SASS', value: 'sass' },
        { name: 'LESS', value: 'less' }
      ]
    }, ...cfg}
  },

  lintTool: (cfg={}) => {
    return {...{
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
    }, ...cfg}
  },

  // empty template function
  fn: (cfg={}) => {
    return {...{}, ...cfg}
  }
}


module.exports = {
  tableFn,
  regex,
  questions
}