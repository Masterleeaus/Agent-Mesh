(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CodeeIntelligenceBaseline = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PROGRAM = Object.freeze({
    name: 'Codee Browser Intelligence',
    baselineVersion: '2.11.1',
    pass: 1,
    primaryRuntime: 'browser',
    optionalAccelerators: Object.freeze(['ollama']),
    authorityModel: 'advisory-ai-governed-effects'
  });

  function getProgramBaseline() {
    return {
      ...PROGRAM,
      optionalAccelerators: [...PROGRAM.optionalAccelerators]
    };
  }

  return Object.freeze({ getProgramBaseline });
});
