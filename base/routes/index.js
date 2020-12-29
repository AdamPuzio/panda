const Panda = require('../../')
const router = Panda.express.Router()


// Define the home page route
router.get('/', function(req, res) {
  res.render('pages/home', {})
})

// Define the about route
router.get('/about', function(req, res) {
  res.send('About us')
})

router.get('/me', Panda.Auth.auth.private, function(req, res) {
  console.log('USER:')
  console.log(res.user)
  if(!res.user) return res.send('User not logged in')
  res.send(JSON.stringify(res.user))
})


router.get('/test', function(req, res) {
  res.send('test1')
})
router.get('/test', function(req, res) {
  res.send('test2')
})


module.exports = router