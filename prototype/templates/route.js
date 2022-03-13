const Panda = require('panda')
const router = Panda.router()

router.get('/', async (ctx, next) => {
  ctx.body = ''
})

module.exports = router