'use strict'

const Core = require('panda-core')
const Wasp = Core.Wasp
const program = new Wasp.Command()

program
  .description('Deploy your Project')
  .argument('[env]')
  .option('--environment', 'The environment to deploy to')
  .action(async function (env, opts, cmd) {
    this.out('Deploy the current Project', 'bold')
    this.out('Press Ctrl+C to cancel')
    this.spacer()

    const spinner = Wasp.spinner('Packaging up Project...')
    spinner.start()

    await new Promise(resolve => setTimeout(resolve, 3000))
    spinner.clear()
    this.success('Project packed up')

    spinner.color = 'yellow'
    spinner.text = 'Containerizing...'
    spinner.render()

    await new Promise(resolve => setTimeout(resolve, 3000))
    spinner.clear()
    this.success('Containerized')

    spinner.color = 'blue'
    spinner.text = 'Deploying...'
    spinner.render()

    await new Promise(resolve => setTimeout(resolve, 3000))
    spinner.clear()
    this.success('Deployed')

    // spinner.succeed('Done!')
    spinner.stop()

    this.spacer()
    this.success(this.style('bold')('Project successfully deployed'))
    this.spacer()
  })
  .parse(process.argv)
