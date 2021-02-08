"use strict";

const Panda = require('../../')
const { PandaError, PandaClientError, PageNotFoundError, ValidationError, UnauthorizedError, ForbiddenError } = Panda.Errors
const ApiGateway = require('moleculer-web')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const path = require('path')
const cors = require('cors')

module.exports = {
  name: 'www',
  mixins: [ApiGateway],

  settings: {
    debugMode: process.env.DEBUG || false,
    port: process.env.PORT || 5000,
    pandaBaseDir: path.join(__dirname, '..'),
    appDir: Panda.cfg.APP_PATH,
    routesDir: path.join(Panda.cfg.APP_PATH, 'routes'),
    tplDir: path.join(Panda.cfg.APP_PATH, 'views'),
    publicDir: path.join(Panda.cfg.APP_PATH, 'public')
  },
  
  methods: {
    handleErr: function(err, req, res, next) {
      switch (true) {
        case err instanceof PageNotFoundError:
        case err instanceof ValidationError:
          break
        case err instanceof UnauthorizedError:
          return res.redirect('/login')
          break
        case err instanceof ForbiddenError:
          return res.status(err.code).send('You do not have the proper permissions')
          break
        case err instanceof PandaError:
        case err instanceof PandaClientError:
          break
      }
      console.log('UNKNOWN ERROR [' + typeof err + ']')
      console.log(err)
      let code = err.code || 500
      let message = err.message || 'ERROR'
      res.status(code).send(message)
    }
  },

  async created() {
    const app = Panda.app()
    const appDir = this.settings.appDir
    const pandaDir = this.settings.pandaBaseDir

    this.app = app
    
    let broker = this.broker
    app.broker = broker
    
    app.use(cors())
    app.use(cookieParser())
    app.use(bodyParser.urlencoded({ extended : false }))
    app.use(bodyParser.json())
    app.use(fileUpload())
    app.use(Panda.express.static(path.join(appDir, 'public')))
    app.use('/~panda', Panda.express.static(path.join(pandaDir, 'public')))
    
    //app.use('/api', this.express())
    
    await Panda.Auth.initPassport(app, broker)

    // set up the view engine
    const pandaTplDir = path.join(pandaDir, 'views')
    const viewPaths = [this.settings.tplDir, pandaTplDir]
    app.set('view engine', 'ejs')
    app.set('views', viewPaths)
    app.set('view options', {root: viewPaths})
    
    // initialize custom routes
    await Panda.App.initRoutes(app, this.settings.routesDir)
    
    // initialize default routes
    if(Panda.cfg.USE_BASE) await Panda.App.initRoutes(app, path.join(pandaDir, 'routes'))

    app.use(function (req, res, next) {
      res.status(404).send('404')
    })

    app.use(this.handleErr)
  },

  started() {
    this.app.listen(Number(this.settings.port), err => {
      if (err)
        return this.broker.fatal(err)

      this.logger.info(`web server started on port ${this.settings.port}`)
    })
  },

  stopped() {
    if (this.app.listening) {
      this.app.close(err => {
        if (err)
          return this.logger.error("web server close error!", err)

        this.logger.info("web server stopped!")
      })
    }
  }
}