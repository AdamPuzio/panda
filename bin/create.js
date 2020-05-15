#!/usr/bin/env node

"use strict"

const fs = require('fs')
const path = require('path')
const ncp = require('ncp').ncp

const sourceDir = path.join(__dirname, '..', 'create')
const destDir = path.join(process.cwd(), 'app')

console.log('Copying app directory structure...')
console.log('    dest: ' + destDir)

ncp(sourceDir, destDir, function (err) {
 if (err) return console.error(err)
  
 console.log('done!')
})