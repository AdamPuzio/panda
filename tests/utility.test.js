const utility = require('../src/utility')


const pickObj = { a: 'valA', b: 'valB', c: 'valC' }
const pickKeysArray = ['a', 'c', 'd']
const pickKeysObj = { a: 'a', b: 'b2', d: 'd' }

test('pick using array', () => {
  const data = utility.pick(pickObj, pickKeysArray)
  expect(data).toEqual({a: 'valA', c: 'valC'})
})

test('pick (no prune) using array', () => {
  const data = utility.pick(pickObj, pickKeysArray, false)
  expect(data).toEqual({a: 'valA', c: 'valC'})
})

test('pick object', () => {
  const data = utility.pick(pickObj, pickKeysObj)
  expect(data).toEqual({ a: 'valA', b2: 'valB' })
})

test('pick (no prune) using object', () => {
  const data = utility.pick(pickObj, pickKeysObj, false)
  expect(data).toEqual({ a: 'valA', b2: 'valB', d2: undefined })
})