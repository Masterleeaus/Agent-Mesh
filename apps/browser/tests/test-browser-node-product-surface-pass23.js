const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'sidebar', 'sidebar.html'), 'utf8');

for (const forbidden of [
  '<title>Titan Code',
  'aria-label="Titan Code navigation"',
  'aria-label="Titan Code pages"',
  'alt="Titan Code logo"',
  '<strong>TITAN CODE</strong>',
  '<h1>TITAN CODE</h1>',
  'Titan Code Project',
  'Loading current Titan Code status',
  'existing Titan Code authorities',
  'existing governed Titan Code surfaces',
  'Ask Titan Code',
  'Analyze Repository',
  '14-manager runtime',
  'Managers & AI Workforce',
  'Analyze Managers',
  'Create Plan Draft'
]) {
  assert(!html.includes(forbidden), `Titan Code/development-only product copy must not ship: ${forbidden}`);
}

for (const required of [
  '<title>Titan Zero Browser Node</title>',
  'aria-label="Titan Zero Browser Node navigation"',
  '<strong>TITAN ZERO</strong>',
  '<span>Browser Node</span>',
  '<h1>TITAN ZERO</h1>',
  'Governed browser execution',
  'data-page="browser"',
  'data-page="intelligence"',
  'data-page="connections"',
  'data-page="mcp"',
  'data-page="knowledge"',
  'data-page="diagnostics"'
]) {
  assert(html.includes(required), `Titan Zero Browser Node product surface is missing: ${required}`);
}

console.log('PASS: Browser Node visible product surface is Titan Zero-native');
