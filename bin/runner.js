#!/usr/bin/env node

"use strict";

const { Runner } = require("moleculer");

const runner = new Runner();
let args = process.argv
args.push('node_modules/panda/base/services')
args.push('app/services')
runner.start(args);