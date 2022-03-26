const Panda = require('../panda')
const Utility = require('../src/util')
const path = require('path')

test('Utility.fileExists()', async () => {
  let packageJson = path.join(process.cwd(), 'package.json')
  let fileExists = await Utility.fileExists(packageJson)
  expect(fileExists).toBe(true)
})

test('Utility.relFileExists()', async () => {
  let packageJson = 'package.json'
  let fileExists = await Utility.relFileExists(packageJson)
  expect(fileExists).toBe(true)
})

test('Utility.loadJsonFile()', async () => {
  let packageJson = path.join(process.cwd(), 'package.json')
  let fileContents = await Utility.loadJsonFile(packageJson)
  expect(fileContents.name).toBe('panda')
})

test('Utility.template()', async () => {
  let tpl = await Utility.template('hello <%= name %>', { name: 'panda' })
  expect(tpl).toBe('hello panda')
})