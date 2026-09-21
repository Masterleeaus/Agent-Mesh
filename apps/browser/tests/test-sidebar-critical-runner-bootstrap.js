const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/sidebar/sidebar.js', 'utf8');
const listeners = new Map();
function el(id, extra = {}) {
  return Object.assign({
    id,
    value: '',
    textContent: '',
    checked: false,
    disabled: false,
    dataset: {},
    addEventListener(name, fn) { listeners.set(`${id}:${name}`, fn); }
  }, extra);
}
const elements = new Map([
  ['confirm-btn', el('confirm-btn')],
  ['generate-debugging-plan-btn', el('generate-debugging-plan-btn')],
  ['debugging-plan-mode', el('debugging-plan-mode')],
  ['stop-btn', el('stop-btn')],
  ['back-btn', el('back-btn')],
  ['refresh-tabs-btn', el('refresh-tabs-btn')],
  ['tab-select', el('tab-select')],
  ['plan-input', el('plan-input')],
  ['message', el('message')],
  ['plan-file-input', el('plan-file-input')],
  ['plan-file-name', el('plan-file-name', { className: '' })]
]);

const context = {
  console: { log(){}, warn(){}, error(){} },
  document: {
    readyState: 'loading',
    addEventListener(){},
    getElementById(id){ return elements.get(id) || null; }
  },
  chrome: { runtime: { onMessage: { addListener(){} } } },
  Map, Set, WeakMap, WeakSet, Promise, URL, Date, Math, Object, Array, String, Number, Boolean, RegExp, JSON, Error
};
vm.runInNewContext(source, context);
assert.strictEqual(typeof context.registerCriticalRunnerHandlers, 'function');
context.registerCriticalRunnerHandlers();
assert.strictEqual(typeof listeners.get('confirm-btn:click'), 'function', 'Start Plan must bind independently of optional subsystems');
assert.strictEqual(typeof listeners.get('generate-debugging-plan-btn:click'), 'function', 'Planner generator must bind independently of optional subsystems');
listeners.get('generate-debugging-plan-btn:click')();
assert(/Titan Code 10-Pass Debugging Plan/.test(elements.get('plan-input').value), 'Planner button must populate the plan textarea');
assert.strictEqual(elements.get('debugging-plan-mode').checked, true, 'Planner button must enable debugging plan mode');
console.log('critical runner/planner bootstrap wiring OK');
