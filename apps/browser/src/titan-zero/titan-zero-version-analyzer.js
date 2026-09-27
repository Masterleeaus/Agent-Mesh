(function attachTitanZeroVersionAnalyzer(global){
  'use strict';
  function parseJson(files,path){try{return JSON.parse(String(files?.[path]||'{}'));}catch{return {};}}
  function analyze(files){
    const composer=parseJson(files,'composer.json'); const pkg=parseJson(files,'package.json');
    const req=Object.assign({},composer.require||{}); const dev=Object.assign({},composer['require-dev']||{});
    const deps=Object.assign({},pkg.dependencies||{}); const devDeps=Object.assign({},pkg.devDependencies||{});
    return {
      php:req.php||null, laravel:req['laravel/framework']||null, livewire:req['livewire/livewire']||null,
      react:deps.react||devDeps.react||null, alpine:deps.alpinejs||deps['@alpinejs/intersect']||devDeps.alpinejs||null,
      vite:devDeps.vite||deps.vite||null, tailwind:devDeps.tailwindcss||deps.tailwindcss||null,
      phpTestFramework:dev['pestphp/pest']?'pest':dev['phpunit/phpunit']?'phpunit':null,
      buildScripts:Object.keys(pkg.scripts||{}), composerPackages:Object.keys(req).length+Object.keys(dev).length,
      npmPackages:Object.keys(deps).length+Object.keys(devDeps).length
    };
  }
  global.CodeeTitanZeroVersionAnalyzer=Object.freeze({analyze});
})(typeof globalThis!=='undefined'?globalThis:this);
