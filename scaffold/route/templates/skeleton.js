const Zeta = require('zeta')
const router = Zeta.router()

router.get('/', async (ctx, next) => {
  ctx.body = ''
})

module.exports = router