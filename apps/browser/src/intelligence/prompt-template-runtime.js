'use strict';

// Adapted from the MIT-licensed OpenBrowser prompt library donor.
// Titan Code keeps this as a bounded, data-only helper. It grants no execution,
// mutation, verification, provider, plan, or canonical authority.
const MAX_TEMPLATE_CHARS = 64 * 1024;
const MAX_VARIABLES = 64;
const MAX_VALUE_CHARS = 16 * 1024;
const VARIABLE_RE = /\$\{([^}:]+)(?::([^}]*))?\}/g;

function boundedText(value, max = MAX_TEMPLATE_CHARS) {
  return String(value ?? '').slice(0, max);
}

function safeVariableName(value) {
  const name = String(value ?? '').trim();
  if (!name || name.length > 120) return '';
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(name)) return '';
  if (['__proto__', 'prototype', 'constructor'].includes(name)) return '';
  return name;
}

function parseTemplateVariables(content) {
  const text = boundedText(content);
  const variables = [];
  const seen = new Set();
  VARIABLE_RE.lastIndex = 0;
  let match;
  while ((match = VARIABLE_RE.exec(text)) !== null && variables.length < MAX_VARIABLES) {
    const name = safeVariableName(match[1]);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    variables.push(Object.freeze({
      name,
      defaultValue: boundedText(match[2] ?? '', MAX_VALUE_CHARS).trim(),
    }));
  }
  return Object.freeze(variables);
}

function ownValue(values, name) {
  if (!values || typeof values !== 'object' || !Object.prototype.hasOwnProperty.call(values, name)) return undefined;
  return values[name];
}

function applyTemplateVariables(content, values = {}) {
  const text = boundedText(content);
  VARIABLE_RE.lastIndex = 0;
  return text.replace(VARIABLE_RE, (_match, rawName, rawDefault) => {
    const name = safeVariableName(rawName);
    if (!name) return '';
    const supplied = ownValue(values, name);
    if (supplied !== undefined && supplied !== null && String(supplied).length > 0) {
      return boundedText(supplied, MAX_VALUE_CHARS);
    }
    return boundedText(rawDefault ?? '', MAX_VALUE_CHARS).trim();
  });
}

function capability() {
  return Object.freeze({
    schema: 'titan-code-prompt-template-runtime/v1',
    max_template_chars: MAX_TEMPLATE_CHARS,
    max_variables: MAX_VARIABLES,
    max_value_chars: MAX_VALUE_CHARS,
    advisory_only: true,
    authority: false,
    execution_authority: false,
    mutation_authority: false,
    verification_authority: false,
    canonical_authority: false,
    plan_authority: false,
  });
}

module.exports = Object.freeze({
  MAX_TEMPLATE_CHARS,
  MAX_VARIABLES,
  MAX_VALUE_CHARS,
  parseTemplateVariables,
  applyTemplateVariables,
  capability,
});
