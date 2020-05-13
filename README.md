# Panda

Panda is a rapid prototyping framework that is build off of two of the best Node.js frameworks: Express and Moleculer. 

The primary objective of Panda is to give you a starting point to start building your applications without a lot of setup. Panda is opiniated, but with a lot of room to customize.

Here are some of the base features you'll have out-of-the-box:
* Express functionality without any setup
* A services API framework without any setup
* EJS templating engine
* An authentication system, complete with register, login and logout routes

## Custom Capabilities

Out-of-the-box, you'll be able to start creating your site with the following building blocks:
* Routes - write Express routes quickly and easily
* Services - build an API using the Moleculer microservices framework
* Public Directory - drop in your images, js, css, etc.
* Templates - create EJS templates to be rendered via your routes

## Quick Start

Install Panda as an NPM module
```bash
npm install --save AdamPuzio/panda
```

Run Panda
```js
 npx panda
```

That's it. You now have a working instance of Panda.

## Application Directory Structure

```
package.json
app
  public
  routes
  services
  templates
```

## ToDo

* Create a generator script to build a project using `npx`
* Build custom configuration logic
* Implement authorization system
