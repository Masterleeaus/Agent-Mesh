'use strict';

const fs = require('node:fs');
const path = require('node:path');

const originalReadFileSync = fs.readFileSync.bind(fs);
const workerSuffix = path.normalize(path.join('apps', 'browser', 'src', 'lib', 'service-worker.js'));

function isCanonicalWorker(target) {
  if (typeof target !== 'string' && !Buffer.isBuffer(target) && !(target instanceof URL)) return false;
  const text = target instanceof URL ? target.pathname : String(target);
  return path.normalize(text).endsWith(workerSuffix) || path.normalize(text).endsWith(path.normalize(path.join('src', 'lib', 'service-worker.js')));
}

fs.readFileSync = function patchedReadFileSync(target, options) {
  const value = originalReadFileSync(target, options);
  if (!isCanonicalWorker(target)) return value;

  const encoding = typeof options === 'string' ? options : options?.encoding;
  if (!encoding) return value;

  const source = String(value);
  return source.replace(/^\s*import\s+['"]\.\.\/browser\/agent-runtime\/background\.js['"];?\s*$/m, '');
};
