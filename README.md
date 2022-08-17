# Panda 

Panda is a rapid application framework that makes spinning up new web applications quick and easy, while still allowing for scalability.

Documentation: https://adampuzio.github.io/panda-docs/

## Why Panda?

The goal of Panda isn't to be _another_ web application framework, but rather a set of tools and best practices woven together to create a platform meant to allow quick and easy development and deployment of web technologies. 

While Panda has certain preferences in those tools and best practices, it allows for _any_ technology to be baked in. In addition to just creating things, Panda allows for the private labeling of your own functionality on top of its base. 

## Installation

### Dependencies

The only dependency for Panda is NodeJS version 14 or greater. That's it. 

### Global Installation

Installing Panda is a breeze:

```bash
npm i -g panda-cli
```

That's it! By installing Panda globally, you now have access to the Panda CLI and Development Toolkit, which now allows you to start building and running your own applications in minutes:

```bash
panda project:create
# use the Project creation tool to build a new Project
cd {project-directory}
panda project:start
```

Your brand new application is up and running at [http://localhost:5000](http://localhost:5000)

### Other Installation Methods

#### As a Library

If you are creating your own application and want to use Panda's functionality without running it through Panda, you can simply install it via `npm install --save panda` and then require it in your own script:

```js
const panda = require('panda')
```

## Development

### Panda CLI

One of the biggest features of Panda is the ability to rapidly create new things using the Panda CLI tool. Using the `panda` command, you can create, install, and run everything right from your terminal.

To view the list of available commands you can run, use:

```bash
panda
```

#### Commands

| Command                 | Description                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| panda app:run <app>     | Run a single Application along with all Services                                 |
| panda command:create    | Create a new Command                                                             |
| panda component:create  | Create a new Component                                                           |
| panda ctx               | Get information about the current Project and how it will be run                 |
| panda model:create      | Create a new Model                                                               |
| panda package:install   | Install a Panda Package into your Project                                        |
| panda package:uninstall | Uninstall a Panda Package from your Project                                      |
| panda project:create    | Create a new Panda Project from scratch                                          |
| panda project:info      | Get detailed information on how your Project is built/configured and will be run |
| panda project:start     | Start all Applications and Services                                              |
| panda route:create      | Create a new Route                                                               | 
| panda service:create    | Create a new Service                                                             |

### Scaffolding

Aside from using the Panda CLI tool to build things quickly and efficiently, you can choose to implement your own favorite technologies and even create your own scaffolds to rapidly build them yourself. 

## Deployment

Panda uses [Moleculer](https://moleculer.services/) under the hood to create its Services. Moleculer is an amazingly fast, flexible, and scalable microservices framework that allows Panda Projects to keep everything contained in one repository, while also deploying to advanced distributed networks of nodes. 

## Panda Development

### Testing

Panda uses [Jest](https://jestjs.io/) as its built-in testing suite. To run the automated tests, from within the Panda directory run:

```bash
npm run test
```

### Linting

Panda uses [Standard](https://standardjs.com/) as its linting tool.

```bash
# to see linting results
npm run lint

# to fix issues and see what can't be fixed
npm run lint-fix
```

## License

Panda is available under the [MIT license](https://tldrlegal.com/license/mit-license).