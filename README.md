# Panda 

Panda is a rapid application framework that makes spinning up new web applications quick and easy, while still allowing for scalability.

## Why Panda?

The goal of Panda isn't to be _another_ web application framework, but rather a set of tools and best practices woven together to create a platform meant to allow quick and easy development and deployment of web technologies. 

While Panda has certain preferences in those tools and best practices, it allows for _any_ technology to be baked in. In addition to just creating things, Panda allows for the private labeling of your own functionality on top of its base. 

## Installation

### Dependencies

The only dependency for Panda is NodeJS version 14 or greater. That's it. 

### Global Installation

Installing Panda is a breeze:

```bash
npm i -g panda
```

That's it! By installing Panda globally, you now have access to the Panda CLI and Development Toolkit, which now allows you to start building and running your own applications in minutes:

```bash
panda create-project
# use the Project creation tool to build a new Project
cd {project-directory}
panda start
```

Your brand new application is up and running at [http://localhost:5000](http://localhost:5000)!

### Other Installation Methods

#### As a Library

If you are creating your own application and want to use Panda's functionality without running it through Panda, you can simply install it via `npm install --save panda` and then require it in your own script:

```js
const panda = require('panda')
```

## Development

### Panda CLI

One of the biggest features of Panda is the ability to rapidly create new things using the Panda CLI tool. Using the `panda` command, you can create, install, and run everything right from your terminal.

| ---------------------- | -------------------------------------------------------------------------------- |
| Command                | Description                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| panda create-project   | Create a new Panda Project from scratch                                          |
| panda create-service   | Create a new Service                                                             |
| panda create-model     | Create a new Model                                                               |
| panda create-route     | Create a new Route                                                               | 
| panda create-component | Create a new Component                                                           |
| panda install          | Install a Panda Package into your Project                                        |
| panda uninstall        | Uninstall a Panda Package from your Project                                      |
| panda start            | Start all Applications and Services                                              |
| panda run <app>        | Run a single Application along with all Services                                 |
| panda project-info     | Get detailed information on how your Project is built/configured and will be run |
| ---------------------- | -------------------------------------------------------------------------------- |

### Scaffolding

Aside from using the Panda CLI tool to build things quickly and efficiently, you can choose to implement your own favorite technologies and even create your own scaffolds to rapidly build them yourself. 

## Deployment

Panda uses [Moleculer](https://moleculer.services/) under the hood to create its Services. Moleculer is an amazingly fast, flexible, and scalable microservices framework that allows Panda Projects to keep everything contained in one repository, while also deploying to advanced distributed networks of nodes. 

### Testing

Panda uses [jest](https://jestjs.io/) as its built-in testing suite. To run the automated tests, from within the Panda directory run:

```bash
npm run test
```

## License

Panda is available under the [MIT license](https://tldrlegal.com/license/mit-license).