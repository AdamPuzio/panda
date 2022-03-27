const Utility = require('../src/util')
const path = require('path')

test('Utility.fileExists()', async () => {
  const packageJson = path.join(process.cwd(), 'package.json')
  const fileExists = await Utility.fileExists(packageJson)
  expect(fileExists).toBe(true)
})

test('Utility.relFileExists()', async () => {
  const packageJson = 'package.json'
  const fileExists = await Utility.relFileExists(packageJson)
  expect(fileExists).toBe(true)
})

test('Utility.loadJsonFile()', async () => {
  const packageJson = path.join(process.cwd(), 'package.json')
  const fileContents = await Utility.loadJsonFile(packageJson)
  expect(fileContents.name).toBe('panda')
})

test('Utility.template()', async () => {
  const tpl = await Utility.template('hello <%= name %>', { name: 'panda' })
  expect(tpl).toBe('hello panda')
})
