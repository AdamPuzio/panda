#!/usr/bin/env node

const Panda = require('../')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()
const inquirer = require('inquirer')

program
  .description('set up a new user')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: user-setup`)
    
    logger.output('Hi there! Let\'s get you set up!', 'green')

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'first_name',
        message: 'What is your first name?'
      },
      {
        type: 'input',
        name: 'last_name',
        message: 'What is your last name?'
      }
    ])

    logger.output(`Welcome, ${answers.first_name}!`, 'green')
    //console.log(cmd.opts())
  })

program.parse(process.argv)