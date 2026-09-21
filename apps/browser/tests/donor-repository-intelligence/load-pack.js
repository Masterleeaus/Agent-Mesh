'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(relativeFiles) {
  const root = path.resolve(__dirname, '../..');
  const context = { console, globalThis: null, structuredClone: global.structuredClone };
  context.globalThis = context;
  vm.createContext(context);
  for (const relative of relativeFiles) {
    const file = path.join(root, relative);
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context, { filename: relative });
  }
  return context;
}
module.exports = { load };
