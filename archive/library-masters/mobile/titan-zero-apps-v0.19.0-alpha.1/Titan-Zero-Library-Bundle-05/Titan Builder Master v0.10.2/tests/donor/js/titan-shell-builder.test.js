const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('resources/js/titan-shell-builder.js', 'utf8');
const listeners = {};
const context = {
  window: { dispatchEvent() {} },
  document: { addEventListener(name, callback) { listeners[name] = callback; } },
  CustomEvent: class { constructor(name, options) { this.type=name; this.detail=options?.detail; } },
  console,
};
vm.createContext(context);
vm.runInContext(source, context);
assert(context.window.TitanShellBuilder, 'runtime exposed');
const schema = { navigation: { default_view:'today', primary:[{id:'today',label:'Today'}], drawer:[] }, home:{widgets:['next_job']}, settings_sections:['privacy'] };
const config = context.window.TitanShellBuilder.fromSchema(schema, {});
assert.strictEqual(config.default_view, 'today');
assert.deepStrictEqual(Array.from(context.window.TitanShellBuilder.validate(config)), []);
const invalid = {...config, primary:[{id:'same',label:'One'},{id:'same',label:'Two'}], default_view:'missing'};
assert(context.window.TitanShellBuilder.validate(invalid).length >= 2);
const moved = context.window.TitanShellBuilder.move(['a','b','c'],0,2);
assert.deepStrictEqual(Array.from(moved), ['b','c','a']);
console.log('Titan shell builder tests passed');
