const Panda = require('../../')
const path = require('path')
const gulp = require('gulp')

const scaffoldList = [
  { name: 'Basic (Wasp)', value: 'command/templates/wasp', default: true },
  { name: 'Basic (Commander)', value: 'command/templates/commander' }
]

module.exports = {
  data: {
    scaffolds: scaffoldList
  },
  
  prompt: [
    {
      type: 'input',
      name: 'command',
      message: 'Command:',
      validate: async (val, answers) => {
        const check = val.length > 1 && /^[a-zA-Z0-9-_]+$/.test(val)
        return check || 'command must be at least 2 letters and alphanumeric (plus dash & underscore)'
      }
    },
    {
      type: 'input',
      name: 'desc',
      message: 'Description:'
    },
    {
      type: 'list',
      name: 'scaffold',
      message: 'Command Type:',
      choices: function(answers) {
        return scaffoldList
      }
    }
  ],

  build: async (options, factory) => {
    // copy scaffolding file
    const dest = `app/commands/${options.command}.js`
    return await factory.copyTemplate(options.scaffold, dest, options)
  },

  // this is just a demo on how you could incorporate gulp
  buildGulp: async (options, factory) => {

    gulp.task('copy', () => {
      return gulp.src(options.scaffold, { cwd: factory.scaffoldDir })
        .pipe(factory.compile(options))
        .pipe(factory.rename(function (path) {
          // Updates the object in-place
          path.basename = `${options.command}`
          path.extname = ".js"
        }))
        .pipe(gulp.dest(path.join('app', 'bin'), { overwrite: false }))
    })
    
    return await gulp.series('copy')
  }
}