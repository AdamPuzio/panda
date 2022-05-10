#!/usr/bin/env node

const Panda = require('../')
const Wasp = require('../src/wasp')
const program = new Wasp.Command()
const path = require('path')
const envinfo = require('envinfo')

program
  .description('debug the local instance and environment')
  .option('-d, --debug [level]', 'Run in debug mode', false)
  .action(async (opts, cmd) => {
    let { logger, options } = Wasp.parse(cmd)
    logger.debug(`command: debug`)
    
    const levelColors = logger._levelColors
    const levels = logger._levels
    const logLevel = logger._level

    logger.out()
    logger.out('Testing Logger Functionality', 'cyan')
    logger.out()
    logger.out(`current log level: ${logLevel}`)
    logger.out()

    logger.out(`Logger Status Levels:`)
    levels.forEach((level) => {
      const color = typeof levelColors[level] !== 'undefined' ? levelColors[level] : ''
      logger.out(`  ${level.toUpperCase()}`, color)
    })

    logger.out()
    logger.out(`Logger Methods Test:`)
    let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(logger))
    methods.forEach((method) => {
      if (['constructor', 'log', 'levelTest', 'exception', '_style', 'prettyjson', 'exitError'].includes(method)) return
      logger.debug(`  logger.${method}() test:`, 'gray')
      const space = logger.levelTest('debug') ? '  ' : ''
      logger[method](`${space}  testing ${method}()`)
    })
    logger.out()
    logger.out(`*** you will only see output that is gte the level '${logLevel}' ***`)
    logger.out(`*** use the --debug flag to see the list of all available logger methods ***`)
    logger.out()

    logger.successMsg(`debugging complete`)
  })

program.parse(process.argv)