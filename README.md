# Panda

Panda is a rapid prototyping framework that is build off of two of the best Node.js frameworks: [Express](http://expressjs.com) and [Moleculer](https://moleculer.services). 

The primary objective of Panda is to give you a starting point to start building your applications without a lot of setup. Panda is opiniated, but with a lot of room to customize.

Here are some of the base features you'll have out-of-the-box:
* Express routing and middleware
* Moleculer microservices API 
* EJS templating engine
* An authentication system, complete with register, login and logout routes
* Integration with MongoDB

## Custom Capabilities

Out-of-the-box, you'll be able to start creating your site with the following building blocks:
* Routes - write Express routes quickly and easily
* Services - build an API using the Moleculer microservices framework
* Public Directory - drop in your images, js, css, etc.
* Views - create EJS templates to be rendered via your routes

## Installation

### Dependencies

To run Panda, you'll need to install the following:
* Node.js
* NPM
* MongoDB

### Quick Start

Create your Node.js project using NPM
```bash
npm init
```

Install Panda as an NPM module
```bash
npm install --save AdamPuzio/panda
```

Run Panda
```js
npx panda
```

That's it. You now have a working instance of Panda.

If you would like Panda to create an `/app` directory with all of the base folders, you can run the following:

```bash
npx panda-create
```

### Configuration

Panda doesn't need any configuring to run, but you can create a `panda.config.js` or `panda.config.json` file in your main directory.

Here are the potential values, along with defaults:

```js
{
  // the MongoDB connection string
  MONGO_URI: 'mongodb://localhost/panda',
  // what to name your JWT token (should be changed for production)
  JWT_TOKEN: 'panda',
  
  // the root path of the /app directory
  APP_PATH: 'app',
  
  // site variables (these will be available within views)
  site: {
    // site name (used for navigation, page titles, etc.)
    name: 'Panda',
    // site description
    desc: '',
    // site logo (not currently being used)
    logo: null,
    // files to include in the header and footer 
    includes: {
      header: {
        js: [],
        css: []
      },
      footer: {
        js: [],
        css: []
      }
    },
    // navigation elements to use in the primary nav
    nav: []
  }
}
```

## Application Directory Structure

```
package.json
app
  public
  routes
  services
  views
```

## Authentication

## Dev Notes

### Panda Development

When working on the core Panda library (not an application that uses Panda), install Panda in a local directory:

```bash
mkdir lib
cd lib
git clone git@github.com:AdamPuzio/panda.git
cd ../
```

Next, update your app's `package.json` file to reflect that it should use the local directory instead of the NPM version in `node_modules`:

```js
{
  ...
  "dependencies": {
    "panda": "file:./lib/panda"
  }
}
```

Finally, run `npm install` to install all Panda dependencies and ensure that it's referencing the local copy. Now, all changes made to the code in `lib/panda` will be reflected immediately. 

## ToDo

### Code Tasks

* Build custom configuration logic
* Implement authorization system
* Implement alternative authentication strategies
* Create a `panda-sample` repo
* Add hooks for middleware
* Allow for .env files to be used for configuration
* Implement hooks for metatags from custom config

### Documentation Tasks

* Error classes

## License

Panda is available under the [MIT license](https://tldrlegal.com/license/mit-license).