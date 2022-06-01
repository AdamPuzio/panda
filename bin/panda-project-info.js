#!/usr/bin/env node

const Panda = require('../')
const Wasp = Panda.Wasp
const Project = require('../src/project')
const program = new Wasp.Command()
const chalk = require('chalk')

program
  .description('Get information about the current Project and how it will be run')
  .option('-r, --rollup', 'Display rollup version')
  .option('-j, --json', 'Output in JSON format')
  .option('-l, --live', 'Output live values')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    const logger = cmd.logger
    logger.debug(`command: project-info`)
    let options = await Wasp.parse(cmd)

    // check to make sure we are in a Project directory
    await Wasp.confirmInProject()

    const projectInfo = await Project.build()
    const shrinkwrap = projectInfo.shrinkwrap
    const rollup = projectInfo.rollup
    let selected = opts.rollup ? rollup : shrinkwrap
    if (opts.live) selected = await Project.live()
    
    console.log(chalk.bold(`Project Details:`))
    if (opts.json) 
      return console.log(JSON.stringify(selected, null, 2))

    function output (base, indent='') {
      Object.entries(base).forEach(([entity, entityObj]) => {
        console.log(chalk.bold(`${indent}  ${entity}`))
        if (entityObj.length === 0) console.log(`    -- none --`)
        entityObj.forEach((item) => {
          const pkg = item._pkg ? item._pkg.package : ''
          let name = item.name || item.path.split('/').pop()
          if (!item.name && pkg) name = `${indent}${pkg}:${name}`
          console.log(chalk.magenta(`${indent}    ${name}`))
          if (pkg) console.log(`${indent}      package: ${pkg}`)
          const vars = ['port', 'namespace']
          vars.forEach((i) => {
            if (item[i]) console.log(`${indent}      ${i}: ${item[i]}`)
          })
          console.log(`${indent}      path: ${item.path}`)
          if (item.config) {
            console.log(`${indent}      config:`)
            Object.entries(item.config).forEach(([i, v]) => {
              if (typeof v !== 'string') v = JSON.stringify(v)
              console.log(`${indent}        ${i}: ${v}`)
            })
          }
          if (item.files) {
            console.log(`${indent}      files:`)
            item.files.forEach((i) => {
              console.log(`${indent}        ${i}`)
            })
          }
          if (item.import) {
            console.log(`${indent}      package entities:`)
            output (item.import, `${indent}      `)
          }
        })
      })
    }
    output(selected)
  })

program.parse(process.argv)